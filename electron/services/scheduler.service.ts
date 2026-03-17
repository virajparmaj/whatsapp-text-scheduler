import * as schedule from 'node-schedule'
import { getAllSchedules, getScheduleById, insertRunLog, toggleSchedule } from './db.service'
import { sendWhatsAppMessage } from './whatsapp.service'
import type { Schedule, RunLog } from '../../shared/types'

// In-memory map of active node-schedule jobs
const jobs = new Map<string, schedule.Job>()

// Mutex: set of schedule IDs currently executing (prevents double-send)
const executing = new Set<string>()

// Callback for notifying the renderer when a job executes
let onExecutedCallback: ((log: RunLog) => void) | null = null

export function setOnExecutedCallback(cb: (log: RunLog) => void): void {
  onExecutedCallback = cb
}

/**
 * Initialize scheduler: load all enabled schedules from DB, register jobs,
 * and detect missed one-time schedules.
 */
export function initScheduler(): void {
  const schedules = getAllSchedules()
  for (const s of schedules) {
    if (!s.enabled) continue

    // Detect missed one-time schedules (past date, still enabled = app was closed)
    if (s.scheduleType === 'one_time' && s.scheduledAt) {
      const fireDate = new Date(s.scheduledAt)
      if (fireDate <= new Date()) {
        insertRunLog(s.id, 'skipped', 'Missed: app was not running at scheduled time', undefined, s.scheduledAt)
        toggleSchedule(s.id, false)
        console.log(`Missed one-time schedule ${s.id} — marked as skipped`)
        continue
      }
    }

    registerJob(s)
  }
  console.log(`Scheduler initialized: ${jobs.size} active jobs`)
}

/**
 * Re-sync all jobs after sleep/wake. Cancels existing timers and re-registers
 * from DB state, also detecting any schedules missed during sleep.
 */
export function resyncAfterWake(): void {
  console.log('Resyncing scheduler after wake...')
  // Cancel all existing jobs
  for (const [, job] of jobs) {
    job.cancel()
  }
  jobs.clear()

  // Re-initialize (also catches missed one-time schedules)
  initScheduler()
}

/**
 * Register a node-schedule job for a given schedule.
 */
export function registerJob(s: Schedule): void {
  // Cancel existing job if any
  cancelJob(s.id)

  let rule: Date | string | schedule.RecurrenceRule

  if (s.scheduleType === 'one_time') {
    if (!s.scheduledAt) return
    const fireDate = new Date(s.scheduledAt)
    if (fireDate <= new Date()) return // Already past
    rule = fireDate
  } else if (s.scheduleType === 'daily') {
    if (!s.timeOfDay) return
    const [hours, minutes] = s.timeOfDay.split(':').map(Number)
    const r = new schedule.RecurrenceRule()
    r.hour = hours
    r.minute = minutes
    r.second = 0
    rule = r
  } else if (s.scheduleType === 'weekly') {
    if (!s.timeOfDay || s.dayOfWeek === null || s.dayOfWeek === undefined) return
    const [hours, minutes] = s.timeOfDay.split(':').map(Number)
    const r = new schedule.RecurrenceRule()
    r.dayOfWeek = s.dayOfWeek
    r.hour = hours
    r.minute = minutes
    r.second = 0
    rule = r
  } else if (s.scheduleType === 'quarterly') {
    // Fires every 3 months: starting at monthOfYear, repeating every 3 months
    if (!s.timeOfDay || s.dayOfMonth === null || s.dayOfMonth === undefined) return
    const [hours, minutes] = s.timeOfDay.split(':').map(Number)
    const startMonth = s.monthOfYear ?? 0  // 0=Jan, 1=Feb, 2=Mar
    const r = new schedule.RecurrenceRule()
    r.month = [0, 1, 2, 3].map(i => (startMonth + i * 3) % 12)
    r.date = s.dayOfMonth
    r.hour = hours
    r.minute = minutes
    r.second = 0
    rule = r
  } else if (s.scheduleType === 'half_yearly') {
    // Fires every 6 months
    if (!s.timeOfDay || s.dayOfMonth === null || s.dayOfMonth === undefined) return
    const [hours, minutes] = s.timeOfDay.split(':').map(Number)
    const startMonth = s.monthOfYear ?? 0  // 0=Jan .. 5=Jun
    const r = new schedule.RecurrenceRule()
    r.month = [startMonth, (startMonth + 6) % 12]
    r.date = s.dayOfMonth
    r.hour = hours
    r.minute = minutes
    r.second = 0
    rule = r
  } else if (s.scheduleType === 'yearly') {
    // Fires once per year on a specific month + day
    if (!s.timeOfDay || s.dayOfMonth === null || s.dayOfMonth === undefined || s.monthOfYear === null || s.monthOfYear === undefined) return
    const [hours, minutes] = s.timeOfDay.split(':').map(Number)
    const r = new schedule.RecurrenceRule()
    r.month = s.monthOfYear
    r.date = s.dayOfMonth
    r.hour = hours
    r.minute = minutes
    r.second = 0
    rule = r
  } else {
    return
  }

  const job = schedule.scheduleJob(rule, async () => {
    await executeJob(s.id)
  })

  if (job) {
    jobs.set(s.id, job)
  }
}

/**
 * Cancel and remove a job from the in-memory map.
 */
export function cancelJob(scheduleId: string): void {
  const existing = jobs.get(scheduleId)
  if (existing) {
    existing.cancel()
    jobs.delete(scheduleId)
  }
}

/**
 * Re-register a job after a schedule update.
 */
export function rescheduleJob(scheduleId: string): void {
  const s = getScheduleById(scheduleId)
  if (!s) {
    cancelJob(scheduleId)
    return
  }
  if (s.enabled) {
    registerJob(s)
  } else {
    cancelJob(scheduleId)
  }
}

/**
 * Execute a scheduled job: send the WhatsApp message and log the result.
 * Uses a mutex to prevent double-sends from overlapping timer + manual triggers.
 */
async function executeJob(scheduleId: string): Promise<RunLog | null> {
  // Mutex: skip if already executing this schedule
  if (executing.has(scheduleId)) {
    console.warn(`Schedule ${scheduleId} is already executing, skipping duplicate`)
    return null
  }

  executing.add(scheduleId)
  try {
    const s = getScheduleById(scheduleId)
    if (!s) return null

    const scheduledTime = new Date().toISOString()

    if (!s.enabled) {
      const log = insertRunLog(scheduleId, 'skipped', 'Schedule is disabled', undefined, scheduledTime)
      if (onExecutedCallback) onExecutedCallback(log)
      return log
    }

    const startTime = Date.now()
    const result = await sendWhatsAppMessage(s.phoneNumber, s.message, s.dryRun)
    const durationMs = Date.now() - startTime

    let status: 'success' | 'failed' | 'dry_run'
    if (result.dryRun) {
      status = 'dry_run'
    } else if (result.success) {
      status = 'success'
    } else {
      status = 'failed'
    }

    const log = insertRunLog(scheduleId, status, result.error, durationMs, scheduledTime)

    // Auto-disable one-time schedules after any execution attempt (not just success)
    if (s.scheduleType === 'one_time') {
      toggleSchedule(s.id, false)
      cancelJob(s.id)
    }

    if (onExecutedCallback) onExecutedCallback(log)
    return log
  } finally {
    executing.delete(scheduleId)
  }
}

/**
 * Manually trigger a test send for a schedule (respects dry-run setting).
 */
export async function testSendSchedule(scheduleId: string): Promise<RunLog | null> {
  return executeJob(scheduleId)
}

/**
 * Get the next scheduled fire time for a given schedule ID.
 */
export function getNextFireTime(scheduleId: string): Date | null {
  const job = jobs.get(scheduleId)
  if (!job) return null
  return job.nextInvocation()?.toDate() ?? null
}

/**
 * Get next fire times for all active jobs.
 */
export function getAllNextFireTimes(): Record<string, string | null> {
  const result: Record<string, string | null> = {}
  for (const [id, job] of jobs) {
    const next = job.nextInvocation()
    result[id] = next ? next.toDate().toISOString() : null
  }
  return result
}

/**
 * Shutdown: cancel all jobs.
 */
export function shutdownScheduler(): void {
  for (const [, job] of jobs) {
    job.cancel()
  }
  jobs.clear()
}
