import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScheduleForm } from '@/components/ScheduleForm'
import type { Schedule, CreateScheduleInput } from '../../shared/types'

interface ScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: Schedule | null
  onSubmit: (data: CreateScheduleInput) => Promise<void>
  defaultDate?: Date
}

export function ScheduleModal({ open, onOpenChange, schedule, onSubmit, defaultDate }: ScheduleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{schedule ? 'Edit Schedule' : 'New Schedule'}</DialogTitle>
      </DialogHeader>
      <ScheduleForm
        initial={schedule}
        defaultDate={defaultDate}
        onSubmit={async (data) => {
          await onSubmit(data)
          onOpenChange(false)
        }}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  )
}
