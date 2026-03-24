import { DatePicker } from './date-picker'
import { TimePicker } from './time-picker'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value: string // "YYYY-MM-DDTHH:mm" (datetime-local format)
  onChange: (value: string) => void
  className?: string
}

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function parseValue(value: string): { date: Date | null; time: string } {
  if (!value) return { date: null, time: getCurrentTime() }
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return { date: null, time: getCurrentTime() }
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return { date: d, time }
  } catch {
    return { date: null, time: getCurrentTime() }
  }
}

function buildValue(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h || 0, m || 0, 0, 0)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const { date, time } = parseValue(value)

  function handleDateChange(newDate: Date) {
    onChange(buildValue(newDate, time))
  }

  function handleTimeChange(newTime: string) {
    if (date) {
      onChange(buildValue(date, newTime))
    } else {
      onChange(buildValue(new Date(), newTime))
    }
  }

  return (
    <div className={cn('flex gap-2 items-start', className)}>
      <DatePicker value={date} onChange={handleDateChange} className="w-[38%] shrink-0" />
      <TimePicker value={time} onChange={handleTimeChange} className="flex-1" />
    </div>
  )
}
