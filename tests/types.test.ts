import { describe, it, expect } from 'vitest'

// Test the mapping logic directly (extracted patterns from db.service.ts)
// We test the mapping logic without requiring better-sqlite3

describe('rowToSchedule mapping', () => {
  function rowToSchedule(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      recipientType: (row.recipient_type as string) || 'contact',
      phoneNumber: row.phone_number as string,
      contactName: row.contact_name as string,
      groupName: (row.group_name as string) || '',
      message: row.message as string,
      scheduleType: row.schedule_type as string,
      scheduledAt: row.scheduled_at as string | null,
      timeOfDay: row.time_of_day as string | null,
      dayOfWeek: row.day_of_week as number | null,
      dayOfMonth: row.day_of_month as number | null,
      monthOfYear: row.month_of_year as number | null,
      enabled: row.enabled === 1,
      dryRun: row.dry_run === 1,
      lastFiredAt: (row.last_fired_at as string) || null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    }
  }

  it('maps a complete row correctly', () => {
    const row = {
      id: 'abc123',
      recipient_type: 'contact',
      phone_number: '+1234567890',
      contact_name: 'John',
      group_name: '',
      message: 'Hello',
      schedule_type: 'daily',
      scheduled_at: null,
      time_of_day: '09:00',
      day_of_week: null,
      day_of_month: null,
      month_of_year: null,
      enabled: 1,
      dry_run: 0,
      last_fired_at: '2025-01-01T00:00:00Z',
      created_at: '2024-12-01T00:00:00Z',
      updated_at: '2024-12-01T00:00:00Z'
    }
    const result = rowToSchedule(row)
    expect(result.id).toBe('abc123')
    expect(result.recipientType).toBe('contact')
    expect(result.phoneNumber).toBe('+1234567890')
    expect(result.groupName).toBe('')
    expect(result.enabled).toBe(true)
    expect(result.dryRun).toBe(false)
    expect(result.lastFiredAt).toBe('2025-01-01T00:00:00Z')
    expect(result.scheduleType).toBe('daily')
  })

  it('maps a group schedule row correctly', () => {
    const row = {
      id: 'grp1',
      recipient_type: 'group',
      phone_number: '',
      contact_name: '',
      group_name: 'Family Group',
      message: 'Hello group',
      schedule_type: 'weekly',
      scheduled_at: null,
      time_of_day: '10:00',
      day_of_week: 1,
      day_of_month: null,
      month_of_year: null,
      enabled: 1,
      dry_run: 1,
      last_fired_at: null,
      created_at: '2024-12-01T00:00:00Z',
      updated_at: '2024-12-01T00:00:00Z'
    }
    const result = rowToSchedule(row)
    expect(result.recipientType).toBe('group')
    expect(result.groupName).toBe('Family Group')
    expect(result.phoneNumber).toBe('')
    expect(result.dryRun).toBe(true)
  })

  it('handles null last_fired_at', () => {
    const row = {
      id: 'abc',
      recipient_type: 'contact',
      phone_number: '+1',
      contact_name: '',
      group_name: '',
      message: 'Hi',
      schedule_type: 'one_time',
      scheduled_at: '2025-01-01T00:00:00Z',
      time_of_day: null,
      day_of_week: null,
      day_of_month: null,
      month_of_year: null,
      enabled: 0,
      dry_run: 1,
      last_fired_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
    const result = rowToSchedule(row)
    expect(result.lastFiredAt).toBeNull()
    expect(result.enabled).toBe(false)
    expect(result.dryRun).toBe(true)
  })

  it('defaults recipientType to contact for legacy rows', () => {
    const row = {
      id: 'legacy1',
      phone_number: '+1234567890',
      contact_name: 'Test',
      message: 'Hi',
      schedule_type: 'daily',
      scheduled_at: null,
      time_of_day: '09:00',
      day_of_week: null,
      day_of_month: null,
      month_of_year: null,
      enabled: 1,
      dry_run: 0,
      last_fired_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
      // recipient_type and group_name missing (legacy)
    }
    const result = rowToSchedule(row)
    expect(result.recipientType).toBe('contact')
    expect(result.groupName).toBe('')
  })
})

describe('rowToRunLog mapping', () => {
  function rowToRunLog(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      scheduleId: row.schedule_id as string,
      status: row.status as string,
      errorMessage: row.error_message as string | null,
      firedAt: row.fired_at as string,
      completedAt: row.completed_at as string | null,
      executionDuration: row.execution_duration as number | undefined,
      scheduledTime: row.scheduled_time as string | undefined,
      retryAttempt: row.retry_attempt as number | undefined,
      retryOf: row.retry_of as string | undefined,
      recipientType: (row.recipient_type as string) || undefined,
      phoneNumber: row.phone_number as string | undefined,
      contactName: row.contact_name as string | undefined,
      groupName: (row.group_name as string) || undefined,
      messagePreview: row.message_preview as string | undefined
    }
  }

  it('maps retry fields correctly', () => {
    const row = {
      id: 'log1',
      schedule_id: 'sched1',
      status: 'failed',
      error_message: 'timeout',
      fired_at: '2025-01-01T00:00:00Z',
      completed_at: '2025-01-01T00:00:01Z',
      execution_duration: 1000,
      scheduled_time: '2025-01-01T00:00:00Z',
      retry_attempt: 2,
      retry_of: 'original-log-id',
      recipient_type: 'contact',
      phone_number: '+1',
      contact_name: 'Test',
      group_name: '',
      message_preview: 'Hello...'
    }
    const result = rowToRunLog(row)
    expect(result.retryAttempt).toBe(2)
    expect(result.retryOf).toBe('original-log-id')
    expect(result.status).toBe('failed')
    expect(result.recipientType).toBe('contact')
  })

  it('maps group run log correctly', () => {
    const row = {
      id: 'log3',
      schedule_id: 'sched2',
      status: 'dry_run',
      error_message: null,
      fired_at: '2025-06-01T00:00:00Z',
      completed_at: '2025-06-01T00:00:02Z',
      execution_duration: 2000,
      scheduled_time: '2025-06-01T00:00:00Z',
      retry_attempt: 0,
      retry_of: undefined,
      recipient_type: 'group',
      phone_number: '',
      contact_name: '',
      group_name: 'Work Team',
      message_preview: 'Meeting reminder'
    }
    const result = rowToRunLog(row)
    expect(result.recipientType).toBe('group')
    expect(result.groupName).toBe('Work Team')
    expect(result.phoneNumber).toBe('')
  })

  it('handles missing retry fields (old rows)', () => {
    const row = {
      id: 'log2',
      schedule_id: 'sched1',
      status: 'success',
      error_message: null,
      fired_at: '2025-01-01T00:00:00Z',
      completed_at: '2025-01-01T00:00:01Z',
      execution_duration: undefined,
      scheduled_time: undefined,
      retry_attempt: undefined,
      retry_of: undefined
    }
    const result = rowToRunLog(row)
    expect(result.retryAttempt).toBeUndefined()
    expect(result.retryOf).toBeUndefined()
  })
})
