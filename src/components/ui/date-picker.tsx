import { useState, useRef, useEffect } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isBefore,
  format,
  startOfDay,
} from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: Date | null
  onChange: (date: Date) => void
  minDate?: Date
  className?: string
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function DatePicker({ value, onChange, minDate, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const today = startOfDay(new Date())
  const min = minDate ? startOfDay(minDate) : today

  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return startOfMonth(value)
    return startOfMonth(new Date())
  })

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const canGoPrev = !isSameMonth(viewMonth, min) && !isBefore(subMonths(viewMonth, 1), startOfMonth(min))

  function handleSelect(day: Date) {
    onChange(day)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-accent',
          !value && 'text-muted-foreground'
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
        {value ? format(value, 'MMM d, yyyy') : 'Pick a date'}
      </button>

      {/* Popover calendar */}
      {open && (
        <div className="absolute z-50 mt-1 w-[280px] rounded-lg border bg-background p-3 shadow-lg animate-fade-in">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              disabled={!canGoPrev}
              className={cn(
                'h-7 w-7 flex items-center justify-center rounded-md transition-colors',
                canGoPrev ? 'hover:bg-accent' : 'text-muted-foreground/30 cursor-not-allowed'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">{format(viewMonth, 'MMMM yyyy')}</span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7">
            {DAY_LABELS.map((d) => (
              <div key={d} className="h-7 flex items-center justify-center text-[11px] text-muted-foreground font-medium">
                {d}
              </div>
            ))}

            {/* Day cells */}
            {days.map((day) => {
              const isSelected = value ? isSameDay(day, value) : false
              const isToday = isSameDay(day, today)
              const isOutside = !isSameMonth(day, viewMonth)
              const isPast = isBefore(day, min)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    'h-8 w-full flex items-center justify-center text-xs rounded-md transition-colors',
                    isSelected && 'bg-primary text-primary-foreground font-semibold',
                    !isSelected && isToday && 'border border-primary text-primary',
                    !isSelected && !isToday && !isOutside && !isPast && 'hover:bg-accent text-foreground',
                    isOutside && !isSelected && 'text-muted-foreground/30',
                    isPast && 'text-muted-foreground/20 cursor-not-allowed'
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
