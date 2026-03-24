import { useState, useMemo, useRef, useEffect } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format,
  addMonths, subMonths, isToday, getDay, getDate
} from 'date-fns'
import { useScheduleContext } from '@/contexts/ScheduleContext'
import { useToast } from '@/components/ui/toast'
import { ScheduleModal } from '@/components/ScheduleModal'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react'
import { truncate } from '@/lib/utils'
import type { Schedule, CreateScheduleInput } from '../../shared/types'

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Status dot colors
const STATUS_DOT_COLORS: Record<string, string> = {
  active: 'bg-teal-700',
  paused: 'bg-gray-400',
  dry_run: 'bg-yellow-500'
}

function getScheduleStatus(s: Schedule): string {
  if (s.dryRun) return 'dry_run'
  return s.enabled ? 'active' : 'paused'
}

/**
 * Expand a schedule into all dates it fires within [rangeStart, rangeEnd].
 * Returns YYYY-MM-DD keys for each firing date.
 */
function getScheduleDatesInRange(s: Schedule, rangeStart: Date, rangeEnd: Date): string[] {
  const dates: string[] = []

  if (s.scheduleType === 'one_time') {
    if (!s.scheduledAt) return dates
    const d = new Date(s.scheduledAt)
    if (d >= rangeStart && d <= rangeEnd) {
      dates.push(format(d, 'yyyy-MM-dd'))
    }
  } else if (s.scheduleType === 'daily') {
    // Fires every day in range
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    for (const day of days) {
      dates.push(format(day, 'yyyy-MM-dd'))
    }
  } else if (s.scheduleType === 'weekly') {
    if (s.dayOfWeek === null || s.dayOfWeek === undefined) return dates
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    for (const day of days) {
      if (getDay(day) === s.dayOfWeek) {
        dates.push(format(day, 'yyyy-MM-dd'))
      }
    }
  } else if (s.scheduleType === 'quarterly') {
    const startMonth = s.monthOfYear ?? 0
    const months = [0, 1, 2, 3].map(i => (startMonth + i * 3) % 12)
    const dayNum = s.dayOfMonth ?? 1
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    for (const day of days) {
      if (months.includes(day.getMonth()) && getDate(day) === dayNum) {
        dates.push(format(day, 'yyyy-MM-dd'))
      }
    }
  } else if (s.scheduleType === 'half_yearly') {
    const startMonth = s.monthOfYear ?? 0
    const months = [startMonth, (startMonth + 6) % 12]
    const dayNum = s.dayOfMonth ?? 1
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    for (const day of days) {
      if (months.includes(day.getMonth()) && getDate(day) === dayNum) {
        dates.push(format(day, 'yyyy-MM-dd'))
      }
    }
  } else if (s.scheduleType === 'yearly') {
    if (s.monthOfYear === null || s.monthOfYear === undefined) return dates
    const dayNum = s.dayOfMonth ?? 1
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    for (const day of days) {
      if (day.getMonth() === s.monthOfYear && getDate(day) === dayNum) {
        dates.push(format(day, 'yyyy-MM-dd'))
      }
    }
  }

  return dates
}

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [popoverDate, setPopoverDate] = useState<Date | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  const { schedules, create, update } = useScheduleContext()
  const { toast } = useToast()
  const gridRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverDate(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Calendar grid days
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Expand ALL schedules across the visible calendar range
  const scheduleDates = useMemo(() => {
    const dateMap = new Map<string, Schedule[]>()
    if (days.length === 0) return dateMap

    const rangeStart = days[0]
    const rangeEnd = days[days.length - 1]

    for (const s of schedules) {
      const fireDates = getScheduleDatesInRange(s, rangeStart, rangeEnd)
      for (const dateKey of fireDates) {
        const existing = dateMap.get(dateKey) || []
        existing.push(s)
        dateMap.set(dateKey, existing)
      }
    }
    return dateMap
  }, [schedules, days])

  function handlePrevMonth() {
    setCurrentMonth((m) => subMonths(m, 1))
    setPopoverDate(null)
  }

  function handleNextMonth() {
    setCurrentMonth((m) => addMonths(m, 1))
    setPopoverDate(null)
  }

  function handleToday() {
    setCurrentMonth(new Date())
    setPopoverDate(null)
  }

  function handleDayClick(day: Date, event: React.MouseEvent<HTMLButtonElement>) {
    const dateKey = format(day, 'yyyy-MM-dd')
    const daySchedules = scheduleDates.get(dateKey) || []

    if (daySchedules.length === 0) {
      // Open create modal with this date pre-filled
      setSelectedDate(day)
      setEditingSchedule(null)
      setPopoverDate(null)
      setModalOpen(true)
    } else {
      // Show popover with schedules for this day
      const rect = event.currentTarget.getBoundingClientRect()
      const gridRect = gridRef.current?.getBoundingClientRect()
      if (gridRect) {
        setPopoverPos({
          top: rect.bottom - gridRect.top + 4,
          left: Math.min(rect.left - gridRect.left, gridRect.width - 280)
        })
      }
      setPopoverDate(day)
    }
  }

  function handleCreateFromPopover(day: Date) {
    setSelectedDate(day)
    setEditingSchedule(null)
    setPopoverDate(null)
    setModalOpen(true)
  }

  function handleEditFromPopover(schedule: Schedule) {
    setEditingSchedule(schedule)
    setSelectedDate(null)
    setPopoverDate(null)
    setModalOpen(true)
  }

  async function handleSubmit(data: CreateScheduleInput) {
    if (editingSchedule) {
      await update(editingSchedule.id, data)
      toast('Schedule updated', 'success')
    } else {
      await create(data)
      toast('Schedule created', 'success')
    }
  }

  const popoverDateKey = popoverDate ? format(popoverDate, 'yyyy-MM-dd') : null
  const popoverSchedules = popoverDateKey ? (scheduleDates.get(popoverDateKey) || []) : []

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendar</h1>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} title="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} title="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday} className="ml-1">
            Today
          </Button>
        </div>
        <h2 className="text-lg font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Empty state overlay */}
      {schedules.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
          <p className="text-base font-medium">No schedules yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Create a schedule from the Dashboard to see it appear on the calendar.
          </p>
        </div>
      ) : (
        <>
          {/* Calendar grid */}
          <div className="relative" ref={gridRef}>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_HEADERS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const daySchedules = scheduleDates.get(dateKey) || []
                const inMonth = isSameMonth(day, currentMonth)
                const today = isToday(day)
                const isPopoverDay = popoverDate ? isSameDay(day, popoverDate) : false

                return (
                  <button
                    key={dateKey}
                    onClick={(e) => handleDayClick(day, e)}
                    className={`
                      relative flex flex-col items-center justify-start
                      rounded-lg border p-1.5 min-h-[72px]
                      transition-all duration-150
                      ${inMonth ? 'bg-card hover:bg-accent/50' : 'bg-muted/20 text-muted-foreground/50'}
                      ${today ? 'ring-2 ring-primary ring-offset-1' : 'border-border/50'}
                      ${isPopoverDay ? 'bg-accent' : ''}
                      hover:shadow-sm
                    `}
                  >
                    <span className={`text-sm font-medium ${today ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </span>

                    {/* Indicator dots */}
                    {daySchedules.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {daySchedules.slice(0, 3).map((s) => (
                          <div
                            key={s.id}
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[getScheduleStatus(s)]}`}
                          />
                        ))}
                        {daySchedules.length > 3 && (
                          <span className="text-[9px] text-muted-foreground ml-0.5">
                            +{daySchedules.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Popover for dates with schedules */}
            {popoverDate && popoverSchedules.length > 0 && popoverPos && (
              <div
                ref={popoverRef}
                className="absolute z-20 w-[280px] rounded-lg border bg-background shadow-lg p-3 animate-fade-in"
                style={{ top: popoverPos.top, left: popoverPos.left }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">
                    {format(popoverDate, 'MMM d, yyyy')}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {popoverSchedules.length} schedule{popoverSchedules.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {popoverSchedules.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleEditFromPopover(s)}
                      className="w-full text-left rounded-md border bg-card p-2 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[getScheduleStatus(s)]}`} />
                        <span className="text-sm font-medium truncate">
                          {s.recipientType === 'group' ? s.groupName : (s.contactName || s.phoneNumber)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 pl-4">
                        {truncate(s.message, 40)}
                      </p>
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleCreateFromPopover(popoverDate)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Schedule
                </Button>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-teal-700" /> Active
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" /> Dry Run
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-400" /> Paused
            </span>
            <span className="ml-auto text-muted-foreground/60">
              Click empty date to create · Click event to edit
            </span>
          </div>
        </>
      )}

      {/* Schedule modal */}
      <ScheduleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        schedule={editingSchedule}
        onSubmit={handleSubmit}
        defaultDate={selectedDate || undefined}
      />
    </div>
  )
}
