# 03 — Architecture

## Purpose
Describe actual runtime architecture, data movement, and platform dependencies.

## Status
- **Confirmed from code** for process boundaries, IPC, DB, scheduler, and automation.
- **Not found in repository**: external backend service, cloud API, or ML service.

## Confirmed from code

### Frontend stack
- React 18 + TypeScript renderer built via Vite/electron-vite (`src/*`, `electron.vite.config.ts`).
- Tailwind CSS + local UI primitives in `src/components/ui`.
- App shell uses tab state, not URL router (`src/App.tsx`).

### Backend stack (local main process)
- Electron main process hosts persistence, scheduling, and automation services.
- SQLite (`better-sqlite3`) for schedules/logs/settings.
- `node-schedule` for in-memory recurrence jobs.
- AppleScript execution via `osascript` wrappers in `electron/utils/applescript.ts`.

### Process/data architecture diagram
```text
Renderer (React)                                    Main (Electron Node)
----------------                                    --------------------
Pages/Components/Hooks
  -> window.api (preload bridge)
     -> ipcRenderer.invoke(channel, ...args)
        -> ipcMain handlers (schedule/logs/settings/contacts)
           -> db.service (SQLite)
           -> scheduler.service (node-schedule job map)
           -> whatsapp.service (open whatsapp:// + AppleScript Enter)

Job execution path:
node-schedule fires -> executeJob(scheduleId)
  -> load schedule from DB
  -> sendWhatsAppMessage(...)
  -> insert run log
  -> disable one-time when applicable
  -> emit schedule:executed event to renderer
  -> show native Notification
```

### State management
- Shared schedule state managed by `ScheduleProvider` context.
- Logs/settings each use focused hooks with IPC refresh calls.
- Event-driven refresh on `schedule:executed` prevents polling loops.

### Hosting/deployment model
- Local packaged desktop app (electron-builder).
- No deployed web frontend/backend separation.
- Local SQLite file in Electron user-data directory.

### Third-party/system dependencies
- WhatsApp Desktop app (deep link + foreground activation).
- macOS Accessibility permission for System Events keystrokes.
- macOS Contacts permission for contact lookup feature.

## Inferred / proposed
- **Strongly inferred** reliability model is best-effort automation, not guaranteed message delivery.
- **Strongly inferred** this architecture intentionally optimizes local simplicity over distributed robustness.

## Important details
- Scheduler re-syncs on macOS wake (`powerMonitor.on('resume')`).
- Missed startup handling is explicit for one-time schedules; recurring missed runs are not replayed.
- Main process sends both IPC execution events and native notifications.

## Open issues / gaps
- In-process scheduler means no execution when app is not running.
- Runtime schema in `db.service.ts` diverges from `electron/db/schema.sql` (maintenance risk).
- No centralized typed response envelope across IPC handlers.

## Recommended next steps
1. Decide whether to keep app-only scheduling or add background service model.
2. Align `schema.sql` with runtime schema or remove stale duplicate schema source.
3. Standardize IPC success/error response contracts.
