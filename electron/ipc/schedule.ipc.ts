import { ipcMain } from 'electron'
import * as db from '../services/db.service'
import { registerJob, cancelJob, rescheduleJob, testSendSchedule, getAllNextFireTimes } from '../services/scheduler.service'
import type { CreateScheduleInput, UpdateScheduleInput } from '../../shared/types'

export function registerScheduleHandlers(): void {
  ipcMain.handle('schedule:getAll', () => {
    try {
      return db.getAllSchedules()
    } catch (err) {
      console.error('[schedule:getAll]', err)
      throw err
    }
  })

  ipcMain.handle('schedule:get', (_, id: string) => {
    try {
      return db.getScheduleById(id)
    } catch (err) {
      console.error('[schedule:get]', err)
      throw err
    }
  })

  ipcMain.handle('schedule:create', (_, data: CreateScheduleInput) => {
    try {
      const schedule = db.createSchedule(data)
      if (schedule.enabled) {
        registerJob(schedule)
      }
      return schedule
    } catch (err) {
      console.error('[schedule:create]', err)
      throw err
    }
  })

  ipcMain.handle('schedule:update', (_, id: string, data: UpdateScheduleInput) => {
    try {
      const schedule = db.updateSchedule(id, data)
      rescheduleJob(id)
      return schedule
    } catch (err) {
      console.error('[schedule:update]', err)
      throw err
    }
  })

  ipcMain.handle('schedule:delete', (_, id: string) => {
    try {
      cancelJob(id)
      db.deleteSchedule(id)
    } catch (err) {
      console.error('[schedule:delete]', err)
      throw err
    }
  })

  ipcMain.handle('schedule:toggle', (_, id: string, enabled: boolean) => {
    try {
      const schedule = db.toggleSchedule(id, enabled)
      rescheduleJob(id)
      return schedule
    } catch (err) {
      console.error('[schedule:toggle]', err)
      throw err
    }
  })

  ipcMain.handle('schedule:testSend', async (_, id: string) => {
    try {
      const log = await testSendSchedule(id)
      if (!log) return { success: false, error: 'Schedule not found', dryRun: false }
      return {
        success: log.status === 'success',
        error: log.errorMessage ?? undefined,
        dryRun: log.status === 'dry_run'
      }
    } catch (err) {
      console.error('[schedule:testSend]', err)
      throw err
    }
  })

  ipcMain.handle('schedule:getNextFireTimes', () => {
    try {
      return getAllNextFireTimes()
    } catch (err) {
      console.error('[schedule:getNextFireTimes]', err)
      throw err
    }
  })
}
