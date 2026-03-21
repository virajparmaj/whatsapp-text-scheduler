# 01 — Features

## Purpose
Inventory product features based on actual implementation, grouped by implementation status.

## Status
- **Confirmed from code** for implemented groups below.
- Includes explicit non-implemented items where user expectations may exist.

## Confirmed implemented

### Scheduling and execution
- Create, read, update, delete schedules via IPC + SQLite (`electron/ipc/schedule.ipc.ts`, `electron/services/db.service.ts`, `src/contexts/ScheduleContext.tsx`).
- Toggle enable/disable per schedule and immediate rescheduling (`schedule:toggle`, `rescheduleJob`).
- Run manual test-send using same execution path as scheduled runs (`schedule:testSend`, `executeJob`).
- Recurrence types implemented: one-time, daily, weekly, quarterly, half-yearly, yearly (`shared/types.ts`, `scheduler.service.ts`, `ScheduleForm.tsx`).
- One-time auto-disable after execution attempt and skip handling for missed one-time startup cases (`scheduler.service.ts`).

### Delivery + automation
- WhatsApp URL-scheme open with prefilled phone/message (`sendWhatsAppMessage`).
- Configurable send delay before Enter keystroke (`settings.send_delay_ms`).
- Dry-run at schedule level plus global dry-run override (`dryRun` + `globalDryRun`).
- Native notification for execution outcome (`electron/main.ts`, `Notification`).

### Data + logs
- Local SQLite persistence for schedules, run logs, settings (`db.service.ts`).
- Run log statuses: `success`, `failed`, `dry_run`, `skipped` (`shared/types.ts`, DB check constraints).
- Activity list filtering and clear logs action (`src/pages/Logs.tsx`, `logs:clear`).
- Startup pruning of logs older than 90 days (`pruneOldLogs(90)`).

### UI and interaction
- Tab shell with Schedules, Calendar, Activity, Settings (`src/App.tsx`).
- Calendar visualization with recurrence expansion across visible range (`src/pages/Calendar.tsx`).
- Contact search from macOS Contacts with result dropdown autofill (`contacts.ipc.ts`, `ScheduleForm.tsx`).
- Toasts for create/update/delete/send feedback (`src/components/ui/toast.tsx`, Dashboard actions).
- Shared schedule state + refresh on `schedule:executed` event (`ScheduleProvider`, preload event bridge).

## Partially implemented
- Reliability for missed recurring runs while app is closed/sleeping is limited.
  - **Confirmed from code**: one-time missed sends are marked skipped on startup.
  - **Not found in repository**: recurring missed-run backfill/replay mechanism.
- Calendar displays recurrence presence but not execution outcomes per day (no per-date success/failure overlay).
- Contacts integration handles permission errors, but UX is form-level warning text only (no dedicated onboarding flow).
- Settings writes arbitrary key/value (`settings:update` has no key whitelist enforcement in handler).

## Not implemented but implied
- Background daemon/LaunchAgent to execute schedules while app UI is closed.
- Retry and backoff policy for failed sends.
- Conflict detection for overlapping schedules to same recipient/time.
- Message template library.
- Full automated test suite.

## Nice-to-have / future
- Import/export schedules.
- Rich calendar drill-down (execution history overlays).
- Menu bar/tray mode.
- Per-schedule timezone control.
- Structured observability/diagnostics panel for automation failures.

## Inferred / proposed
- **Strongly inferred** product intent is “single-user local utility,” so some omitted SaaS features (multi-user auth, web backend) are deliberate.

## Important details
- Duplicate action currently copies fields and creates a new enabled schedule by default (no forced disable in code).
- `schedule:executed` push updates schedules/logs without polling.

## Open issues / gaps
- Runtime contract mismatch: frontend `testSend` type expects `SendResult`, backend returns execution log object.
- Reliability depends on macOS UI automation conditions (unlocked session, WhatsApp responsiveness).

## Recommended next steps
1. Fix `testSend` contract mismatch first (type + IPC shape).
2. Add retry/backoff and better missed-run handling.
3. Add automated tests for scheduler, IPC, and DB mapping.
