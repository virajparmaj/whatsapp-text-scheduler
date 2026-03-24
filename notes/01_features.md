# 01 — Features

## Purpose
Inventory product features based on actual implementation, grouped by implementation status.

## Status
- Last updated: 2026-03-23
- **Confirmed from code** for implemented groups below.

## Confirmed implemented

### Scheduling and execution
- Create, read, update, delete schedules via IPC + SQLite (`electron/ipc/schedule.ipc.ts`, `electron/services/db.service.ts`, `src/contexts/ScheduleContext.tsx`).
- Toggle enable/disable per schedule and immediate rescheduling (`schedule:toggle`, `rescheduleJob`).
- Run manual test-send using the same execution path as scheduled runs (`schedule:testSend`, `executeJob`).
- Recurrence types implemented: one-time, daily, weekly, quarterly, half-yearly, yearly (`shared/types.ts`, `scheduler.service.ts`, `ScheduleForm.tsx`).
- Recipient types: `contact` (phone number) and `group` (`enableGroupScheduling` setting gates group mode in the form).
- Extended schedule dialog for quarterly/half-yearly/yearly config (`ExtendedScheduleDialog.tsx`) with `TimePicker` component.
- Conflict detection on create/edit: warns if same phone + overlapping fire time already exists (`schedule:checkConflicts`, `findConflicts`).
- One-time auto-disable after execution attempt and skip handling for missed one-time startup cases.
- Startup/wake catch-up for missed recurring schedules (`detectAndCatchUpMissedRuns`).
- Retry with exponential backoff for transient failures (10s → 30s → 90s; max from settings).

### Delivery + automation
- WhatsApp URL-scheme open with prefilled phone/message (`sendWhatsAppMessage`).
- Configurable send delay before Enter keystroke (`settings.send_delay_ms`).
- Dry-run at schedule level plus global dry-run override (`dryRun` + `globalDryRun`).
- Auto-launch configured WhatsApp app if not already running.
- Screen-lock detection to skip sends safely instead of failing blindly.
- Native notification for execution outcome (`electron/main.ts`, `Notification`).

### Data + logs
- Local SQLite persistence for schedules, run logs, settings (`db.service.ts`).
- Run log statuses: `success`, `failed`, `dry_run`, `skipped`.
- Run log metadata: execution duration, scheduled time, retry attempt, retry origin.
- Activity list filtering and clear logs action (`src/pages/Logs.tsx`, `logs:clear`).
- Startup pruning of logs older than 90 days (`pruneOldLogs(90)`).
- Startup DB integrity check and owner-only DB file permissions.

### UI and interaction
- Tab shell with Schedules, Calendar, Activity, Settings (`src/App.tsx`).
- Calendar visualization with recurrence expansion across visible range (`src/pages/Calendar.tsx`).
- Contact search from macOS Contacts with result dropdown autofill (`contacts.ipc.ts`, `ScheduleForm.tsx`).
- Toasts for create/update/delete/send feedback (`src/components/ui/toast.tsx`, Dashboard actions).
- Shared schedule state + refresh on `schedule:executed` event (`ScheduleProvider`, preload event bridge).
- Dashboard timeline grouping (Upcoming / Quarterly / Half-Yearly / Yearly / Beyond / Paused).
- Dashboard search bar (filter by contact name, phone, or message) + sort controls (next fire, A–Z, created, updated).
- Cmd+N global keyboard shortcut triggers new schedule modal (via `app:new-schedule` window event).
- Theme picker in Settings (system / light / dark) stored in `theme` setting.
- Max Retries control exposed in Settings UI (was DB-only before); bounds-clamped 1–10.
- Developer section in Settings: "Rebuild App" button triggers `api.rebuildApp()` for in-place hot-reload.
- Close-to-tray background runtime with tray menu and start-at-login toggle.
- DB auto-migration from legacy app data paths on first launch.

## Partially implemented
- Missed recurring runs are caught up only once per schedule (not full multi-run replay).
- Calendar shows recurrence presence but not per-day execution outcomes.
- Contacts integration handles permission errors, but UX is still form-level warning text (no guided onboarding).
- Theme setting (`theme`) persisted in DB and applied at app level, but dark token overrides in Tailwind are incomplete.

## Not implemented but implied
- Background daemon/LaunchAgent to execute schedules when the app process is fully stopped.
- Conflict detection for overlapping schedules to same recipient/time.
- Message template/snippets library.
- Multi-device sync/backup workflow.

## Nice-to-have / future
- Import/export schedules.
- Rich calendar drill-down (execution-state overlays + history panel).
- Per-schedule timezone control.
- Structured diagnostics page for automation failures.
- Undo/redo for destructive actions (delete schedule / clear logs).

## Important details
- Duplicate action currently copies fields and creates a new enabled schedule by default.
- `schedule:executed` push updates schedules/logs without polling.
- `schedule:create` now validates core input shape in IPC (phone/message/type/time checks).
- `schedule:testSend` now returns `SendResult` as expected by renderer types.

## Open issues / gaps
- Reliability still depends on macOS UI automation conditions (unlocked session, WhatsApp responsiveness).
- No first-run setup wizard to reduce permission/config friction.
- No portable data sync/export workflow yet.

## Recommended next steps
1. Add first-run checklist + one-click diagnostics.
2. Complete dark theme token set (Tailwind dark overrides).
3. Add import/export + sync-safe backup path (manual first, optional auto-sync later).
