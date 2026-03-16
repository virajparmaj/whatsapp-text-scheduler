# 11 — Known Issues

## Critical

### 1. App Must Stay Running for Schedules to Fire
- **Confirmed from code + README.**
- node-schedule jobs live in the Electron main process memory. If the app is quit, all jobs are lost. On next launch, `initScheduler()` re-registers them — but any scheduled sends that occurred while the app was closed are missed silently.
- **Impact**: Scheduled messages are not sent if the user quits the app or the Mac reboots.
- **Fix path**: Implement a macOS LaunchAgent (`~/Library/LaunchAgents/`) to keep the process running, or persist and check "missed" runs on startup.

### 2. Mac Must Be Unlocked for AppleScript Automation
- **Confirmed from code + README.**
- `System Events` cannot control UI when the screen is locked.
- **Impact**: Overnight or out-of-hours schedules will fail silently if the Mac sleeps or the screen is locked.
- **Fix path**: No clean fix without a different sending mechanism (unofficial WhatsApp API, or WhatsApp Business API — both out of scope).

### 3. WhatsApp Desktop Must Be Running and Logged In
- **Confirmed from code + README.**
- URL scheme `whatsapp://` only works if the app is installed and running.
- **Impact**: If WhatsApp is not running, the URL scheme may open it but the chat may not be ready within `sendDelayMs`, causing Enter to be pressed before the message text is loaded.
- **Fix path**: Increase `sendDelayMs` as a workaround. No deterministic fix without a proper API.

---

## Medium

### 4. IPC Handlers Lack Try/Catch
- **Confirmed from code** (`electron/ipc/*.ipc.ts`).
- Unhandled exceptions in IPC handlers will reject the renderer Promise with a generic Electron error rather than a structured error object.
- **Impact**: Error messages shown to the user may be unhelpful. Crashes in one handler do not affect others, but the failing operation gives no actionable feedback.
- **Fix path**: Wrap all `ipcMain.handle` callbacks in try/catch and return `{ success: false, error: string }` envelopes.

### 5. No Retry Logic for Failed Sends
- **Confirmed from code** — `executeJob` logs failure and exits.
- **Impact**: A failed send (wrong delay, WhatsApp not ready) is logged but never retried. User must manually trigger a test send.
- **Fix path**: Add configurable retry count with exponential back-off in `scheduler.service.ts`.

### 6. No User Notification on Background Send Result
- **Not found in repository** — no `Notification` API usage.
- **Impact**: If the app window is minimised or the user is on another desktop, they will not know whether a scheduled send succeeded or failed.
- **Fix path**: Use Electron's `new Notification(...)` (supported natively on macOS) in the execution callback.

### 7. Dark Mode Declared but Not Implemented
- **Confirmed from code** — `tailwind.config.ts` sets `darkMode: 'class'` but no `dark:` variant CSS variables are defined in `src/index.css`.
- **Impact**: Enabling dark mode class has no visual effect; the app is permanently light-themed.
- **Fix path**: Add `dark:` CSS variable overrides in `src/index.css`.

### 8. Packaged App May Fail with Native Module Error
- **Strongly inferred** from absence of `asar` exclusion config.
- `better-sqlite3` ships a `.node` binary that cannot be executed from within an asar archive.
- **Fix path**: Add to `package.json` build config:
  ```json
  "build": {
    "asar": true,
    "asarUnpack": ["node_modules/better-sqlite3/**"]
  }
  ```

### 9. AppleScript Command Injection Risk (Low Severity in Single-User Context)
- **Confirmed from code** — `contacts.ipc.ts` strips quotes and backslashes from contact search query before embedding in AppleScript string.
- Sanitisation is basic regex; edge cases with unusual Unicode or multi-byte characters are untested.
- **Impact**: In the single-user personal context, risk is minimal. If app were ever multi-user/networked, this would be critical.

---

## Low

### 10. Completed One-Time Schedules Accumulate in the List
- **Confirmed from code** — disabled one-time schedules remain in the DB and UI indefinitely with "Done" badge.
- **Impact**: Visual clutter over time.
- **Fix path**: Auto-archive or soft-delete one-time schedules after execution, or add a "Clear completed" button.

### 11. No Loading Skeletons
- **Confirmed from code** — hooks use `loading: boolean` but pages show blank content (or empty state) while fetching.
- **Impact**: Brief flash of empty state on tab switch.
- **Fix path**: Add skeleton placeholder rows during loading state.

### 12. Test Send Result Only Visible Momentarily
- **Confirmed from code** — Dashboard shows inline result string that is not auto-dismissed or persisted in any state. Result disappears if the list refreshes.
- **Fix path**: Use a toast notification library (e.g., sonner) for transient feedback.

### 13. No Test Coverage
- **Not found in repository** — no test files, no jest/vitest config.
- **Impact**: Regressions in scheduling logic, IPC handling, or AppleScript generation have no automated safety net.
- **Fix path**: Add vitest for unit tests on `db.service.ts`, `scheduler.service.ts`, and utility functions.

### 14. Contact Search Error Silently Swallowed
- **Confirmed from code** — `contacts.ipc.ts` returns `[]` on any error (including permission denied, AppleScript timeout).
- **Impact**: User sees an empty dropdown with no explanation when Contacts permission is not granted.
- **Fix path**: Return a structured response with a `permissionDenied` flag; show "Grant Contacts access in Settings" hint in the dropdown.
