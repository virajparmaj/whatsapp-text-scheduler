import { useState } from 'react'
import { useLogs } from '@/hooks/useLogs'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { formatDateTime, truncate, formatDuration } from '@/lib/utils'
import { Trash2, ScrollText, Clock, Timer } from 'lucide-react'

export function Logs() {
  const { logs, loading, clearLogs } = useLogs()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = statusFilter === 'all'
    ? logs
    : logs.filter((l) => l.status === statusFilter)

  async function handleClear() {
    await clearLogs()
    setConfirmClear(false)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-7 w-32 rounded bg-muted animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-6 w-16 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-muted" />
                  <div className="h-3 w-56 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Activity Log</h1>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-32"
          >
            <option value="all">All</option>
            <option value="success">Sent</option>
            <option value="failed">Failed</option>
            <option value="dry_run">Dry Run</option>
            <option value="skipped">Skipped</option>
          </Select>
          {confirmClear ? (
            <div className="flex gap-1">
              <Button variant="destructive" size="sm" onClick={handleClear}>
                Confirm Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClear(true)}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-2">
            <ScrollText className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">No log entries yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Activity will appear here after your scheduled messages run. Use "Test Send" on a schedule to generate your first log entry.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border bg-card p-4 card-hover"
            >
              <div className="flex items-start gap-3">
                {/* Status badge */}
                <div className="pt-0.5">
                  <StatusBadge status={log.status} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {log.contactName || log.phoneNumber || log.scheduleId.slice(0, 8)}
                    </span>
                    {log.contactName && log.phoneNumber && (
                      <span className="text-xs text-muted-foreground">{log.phoneNumber}</span>
                    )}
                  </div>
                  {log.messagePreview && (
                    <p className="text-xs text-muted-foreground truncate mb-1.5">
                      {truncate(log.messagePreview, 80)}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(log.firedAt)}
                    </span>
                    {log.executionDuration !== undefined && (
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {formatDuration(log.executionDuration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Error message */}
                {log.errorMessage && (
                  <div className="text-xs text-destructive max-w-[200px] text-right">
                    {log.errorMessage}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
