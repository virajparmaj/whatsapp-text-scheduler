# 01 — Features

## Confirmed Implemented

### Schedule Management
- Create schedules — `src/pages/Dashboard.tsx`, `src/components/ScheduleForm.tsx`, `electron/ipc/schedule.ipc.ts`
- Edit schedules (modal with pre-filled form) — `src/pages/Dashboard.tsx`
- Delete schedules — `src/pages/Dashboard.tsx`, `electron/ipc/schedule.ipc.ts`
- Duplicate schedules — `src/pages/Dashboard.tsx` (copies all fields, generates new ID)
- Enable / disable toggle per schedule — `electron/ipc/schedule.ipc.ts`, `db.service.ts`

### Schedule Types
- One-time (exact datetime) — `electron/services/scheduler.service.ts`
- Daily (time of day) — scheduler uses `RecurrenceRule`
- Weekly (day of week + time) — scheduler uses `RecurrenceRule`
- Quarterly (month slot + day-of-month + time) — e.g., Jan/Apr/Jul/Oct
- Half-yearly (month slot + day-of-month + time) — e.g., Jan/Jul
- Yearly (specific month + day-of-month + time)
- Extended schedule configuration UI — `src/components/ExtendedScheduleDialog.tsx`

### WhatsApp Automation
- URL scheme `whatsapp://send?phone=...&text=...` to open chat — `electron/services/whatsapp.service.ts`
- AppleScript + System Events keystroke Enter to send — `electron/utils/applescript.ts`
- Configurable send delay (default 3000 ms) — `electron/services/whatsapp.service.ts`
- WhatsApp app name configurable (default 'WhatsApp') — settings

### Dry-Run Mode
- Per-schedule dry-run toggle — `shared/types.ts`, `ScheduleForm.tsx`
- Global dry-run override (Settings page) — `electron/ipc/settings.ipc.ts`
- Dry-run opens WhatsApp but does NOT press Enter — `whatsapp.service.ts`
- Logged with status `dry_run`

### Test Send
- Manual execution via Play button in Dashboard — `electron/ipc/schedule.ipc.ts` (`schedule:testSend`)
- Same execution path as scheduled send, toast result shown

### Contact Search
- macOS Contacts app integration via AppleScript — `electron/ipc/contacts.ipc.ts`
- Debounced search autocomplete (300 ms, 2+ chars) — `src/components/ScheduleForm.tsx`
- Auto-fills phone number and contact name from selected contact
- Sanitises query (strips quotes, backslashes)
- Max 15 results in dropdown

### Activity Logs
- Execution log for every run (success, failed, dry_run, skipped) — `electron/services/db.service.ts`
- Filter by status — `src/pages/Logs.tsx`
- Real-time refresh via `schedule:executed` IPC event
- Clear all logs or logs older than N days — `electron/ipc/logs.ipc.ts`

### Settings
- Global dry-run toggle — `electron/ipc/settings.ipc.ts`
- Default country code — stored in SQLite `settings` table
- Send delay (ms) — used in `whatsapp.service.ts`
- WhatsApp app name — used in AppleScript activation
- Accessibility permission check + deep link to System Settings
- Contacts permission check + deep link to System Settings

### Persistence
- SQLite at `~/Library/Application Support/whatsapp-text-scheduler/schedules.db`
- WAL mode + foreign keys enabled — `electron/services/db.service.ts`
- Schema migration on startup (adds new columns if missing)

### App UX
- Native macOS title bar (hiddenInset) with traffic lights at (15, 15)
- Three-tab layout: Dashboard, Activity, Settings
- Sidebar navigation with icons (lucide-react)
- Status badges per schedule (Active, Paused, Dry Run, Done) — `src/components/StatusBadge.tsx`
- Schedule label showing next-run description

## Partially Implemented

### Schedule Status "Done" for One-Time
- One-time schedules auto-disable after successful send — `electron/services/scheduler.service.ts`
- UI shows "Done" badge for disabled one-time schedules — `src/pages/Dashboard.tsx`
- **Gap**: Completed one-time schedules remain in the list permanently. No archive or auto-cleanup.

### Error Display in Logs
- `error_message` column in `run_logs` stored and displayed — `src/pages/Logs.tsx`
- **Gap**: Error messages are truncated in table column; no expand/detail view.

## Not Implemented but Implied by Product

- System notifications on message send or failure — no `Notification` API calls found
- App stays in macOS Dock/menu bar when all windows closed — current code keeps app alive on macOS but there is no menu bar tray icon (`Tray` not used)
- Retry logic for failed sends — not found
- Schedule conflict / overlap detection — not found
- Timezone support — all times stored and fired in local system time; no timezone field

## Nice-to-Have / Future

- Message templates (reusable saved messages)
- Calendar view of upcoming scheduled messages
- Export / import schedules (JSON backup)
- macOS LaunchAgent for background-daemon mode (app does not need to stay open)
- System tray / menu bar icon so app can be hidden from Dock
- Bulk scheduling (multiple recipients from a list)
- Group message support (requires WhatsApp Web API or similar — blocked by platform)
- Retry with configurable back-off for failed sends
- Test coverage (no test files present)
