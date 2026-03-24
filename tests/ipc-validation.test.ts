import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Extract the validateCreateInput function logic and test it.
 * We replicate the validation here since it can't be imported directly
 * (it's not exported, and importing the module would require Electron).
 */

type ScheduleType = 'one_time' | 'daily' | 'weekly' | 'quarterly' | 'half_yearly' | 'yearly'
type RecipientType = 'contact' | 'group'

interface CreateScheduleInput {
  recipientType?: RecipientType
  phoneNumber: string
  contactName?: string
  groupName?: string
  message: string
  scheduleType: ScheduleType
  scheduledAt?: string
  timeOfDay?: string
  dayOfWeek?: number
  dayOfMonth?: number
  monthOfYear?: number
  dryRun?: boolean
}

const VALID_SCHEDULE_TYPES = new Set<ScheduleType>([
  'one_time', 'daily', 'weekly', 'quarterly', 'half_yearly', 'yearly'
])

const TIME_OF_DAY_RE = /^\d{2}:\d{2}$/

function validateCreateInput(data: CreateScheduleInput): string | null {
  const recipientType = data.recipientType || 'contact'

  if (recipientType === 'group') {
    if (!data.groupName || typeof data.groupName !== 'string' || data.groupName.trim().length < 1) {
      return 'Group name is required for group schedules'
    }
  } else {
    if (!data.phoneNumber || typeof data.phoneNumber !== 'string' || data.phoneNumber.trim().length < 7) {
      return 'Phone number is required (min 7 characters)'
    }
  }
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
    return 'Message is required'
  }
  if (!VALID_SCHEDULE_TYPES.has(data.scheduleType)) {
    return `Invalid schedule type: ${data.scheduleType}`
  }
  if (data.scheduleType === 'one_time') {
    if (!data.scheduledAt || isNaN(Date.parse(data.scheduledAt))) {
      return 'scheduledAt must be a valid ISO date for one-time schedules'
    }
  } else {
    if (!data.timeOfDay || !TIME_OF_DAY_RE.test(data.timeOfDay)) {
      return 'timeOfDay must be in HH:mm format for recurring schedules'
    }
  }
  return null
}

describe('IPC schedule input validation', () => {
  const validOneTime: CreateScheduleInput = {
    phoneNumber: '+1234567890',
    message: 'Hello!',
    scheduleType: 'one_time',
    scheduledAt: new Date(Date.now() + 86400000).toISOString()
  }

  const validDaily: CreateScheduleInput = {
    phoneNumber: '+1234567890',
    message: 'Good morning',
    scheduleType: 'daily',
    timeOfDay: '09:00'
  }

  it('accepts valid one-time schedule', () => {
    expect(validateCreateInput(validOneTime)).toBeNull()
  })

  it('accepts valid daily schedule', () => {
    expect(validateCreateInput(validDaily)).toBeNull()
  })

  it('rejects empty phone number', () => {
    const input = { ...validOneTime, phoneNumber: '' }
    expect(validateCreateInput(input)).toContain('Phone number')
  })

  it('rejects short phone number', () => {
    const input = { ...validOneTime, phoneNumber: '12345' }
    expect(validateCreateInput(input)).toContain('Phone number')
  })

  it('rejects empty message', () => {
    const input = { ...validOneTime, message: '' }
    expect(validateCreateInput(input)).toContain('Message')
  })

  it('rejects whitespace-only message', () => {
    const input = { ...validOneTime, message: '   ' }
    expect(validateCreateInput(input)).toContain('Message')
  })

  it('rejects invalid schedule type', () => {
    const input = { ...validOneTime, scheduleType: 'monthly' as ScheduleType }
    expect(validateCreateInput(input)).toContain('Invalid schedule type')
  })

  it('rejects one-time without scheduledAt', () => {
    const input = { ...validOneTime, scheduledAt: undefined }
    expect(validateCreateInput(input)).toContain('scheduledAt')
  })

  it('rejects one-time with invalid date', () => {
    const input = { ...validOneTime, scheduledAt: 'not-a-date' }
    expect(validateCreateInput(input)).toContain('scheduledAt')
  })

  it('rejects recurring without timeOfDay', () => {
    const input = { ...validDaily, timeOfDay: undefined }
    expect(validateCreateInput(input)).toContain('timeOfDay')
  })

  it('rejects recurring with bad timeOfDay format', () => {
    const input = { ...validDaily, timeOfDay: '9:00' }
    expect(validateCreateInput(input)).toContain('timeOfDay')
  })

  it('accepts all valid schedule types', () => {
    for (const type of ['one_time', 'daily', 'weekly', 'quarterly', 'half_yearly', 'yearly'] as ScheduleType[]) {
      const input: CreateScheduleInput = {
        phoneNumber: '+1234567890',
        message: 'test',
        scheduleType: type,
        ...(type === 'one_time'
          ? { scheduledAt: new Date(Date.now() + 86400000).toISOString() }
          : { timeOfDay: '09:00' })
      }
      expect(validateCreateInput(input)).toBeNull()
    }
  })

  // Group schedule validation
  it('accepts valid group schedule', () => {
    const input: CreateScheduleInput = {
      recipientType: 'group',
      phoneNumber: '',
      groupName: 'Family Group',
      message: 'Hello group!',
      scheduleType: 'daily',
      timeOfDay: '09:00'
    }
    expect(validateCreateInput(input)).toBeNull()
  })

  it('rejects group schedule without groupName', () => {
    const input: CreateScheduleInput = {
      recipientType: 'group',
      phoneNumber: '',
      groupName: '',
      message: 'Hello',
      scheduleType: 'daily',
      timeOfDay: '09:00'
    }
    expect(validateCreateInput(input)).toContain('Group name')
  })

  it('rejects group schedule with whitespace-only groupName', () => {
    const input: CreateScheduleInput = {
      recipientType: 'group',
      phoneNumber: '',
      groupName: '   ',
      message: 'Hello',
      scheduleType: 'daily',
      timeOfDay: '09:00'
    }
    expect(validateCreateInput(input)).toContain('Group name')
  })

  it('does not require phone for group schedules', () => {
    const input: CreateScheduleInput = {
      recipientType: 'group',
      phoneNumber: '',
      groupName: 'My Group',
      message: 'Hello',
      scheduleType: 'daily',
      timeOfDay: '09:00'
    }
    expect(validateCreateInput(input)).toBeNull()
  })

  it('still requires phone for contact schedules (default recipientType)', () => {
    const input: CreateScheduleInput = {
      phoneNumber: '123',
      message: 'Hello',
      scheduleType: 'daily',
      timeOfDay: '09:00'
    }
    expect(validateCreateInput(input)).toContain('Phone number')
  })
})

describe('IPC validation function exists in source', () => {
  it('schedule.ipc.ts contains validateCreateInput', () => {
    const src = readFileSync(join(__dirname, '..', 'electron/ipc/schedule.ipc.ts'), 'utf-8')
    expect(src).toContain('validateCreateInput')
    expect(src).toContain('VALID_SCHEDULE_TYPES')
    expect(src).toContain('TIME_OF_DAY_RE')
  })
})
