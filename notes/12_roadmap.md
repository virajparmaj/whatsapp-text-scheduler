# 12 — Roadmap

## Status

Grounded in confirmed code gaps and inferred product needs. All items below are proposed, not implemented unless noted.

---

## Immediate Fixes (High Impact, Low Effort)

1. **Wrap IPC handlers in try/catch**
   - Files: `electron/ipc/*.ipc.ts`
   - Return `{ success, error }` envelopes to renderer.
   - Prevents silent failures and generic Electron error messages.

2. **Fix asar packaging for better-sqlite3**
   - Add `"asarUnpack": ["node_modules/better-sqlite3/**"]` to electron-builder config in `package.json`.
   - Required for packaged `.app` to work reliably.

3. **Add system notification on send result**
   - File: `electron/services/scheduler.service.ts`
   - Use Electron `Notification` API after `executeJob()` completes.
   - Show success or failure notification even when app window is minimised.

4. **Show permission-denied hint in contact search dropdown**
   - File: `electron/ipc/contacts.ipc.ts`, `src/components/ScheduleForm.tsx`
   - Return `{ results: [], permissionDenied: boolean }` instead of `Contact[]`.
   - Show "Grant Contacts access in Settings →" if denied.

5. **Auto-dismiss test send result with toast**
   - Replace inline result string in `Dashboard.tsx` with a proper toast (sonner or similar).
   - Prevents stale result showing after list refresh.

---

## Short-Term Improvements

6. **Dark mode support**
   - Add `dark:` CSS variable overrides in `src/index.css`.
   - Tailwind config already has `darkMode: 'class'`.

7. **Archive completed one-time schedules**
   - Auto-move one-time schedules to a "Done" section or allow one-click clear.
   - Reduces Dashboard clutter.

8. **Loading skeletons**
   - Add skeleton rows while `useSchedules` / `useLogs` are fetching.
   - Eliminates blank-state flash on tab switch.

9. **Missed-run detection on startup**
   - On `initScheduler()`, check for one-time schedules whose `scheduled_at` has passed but `enabled` is still true.
   - Log them as `skipped` with a note that the app was not running.

10. **Retry logic for failed sends**
    - Add `retryCount` and `retryDelayMs` fields to `AppSettings`.
    - In `executeJob()`, retry N times with exponential back-off on failure.

---

## Medium-Term Improvements

11. **macOS LaunchAgent for background scheduling**
    - Create a separate lightweight Node.js daemon that runs independently of the Electron window.
    - Register as a LaunchAgent so it starts on login and survives app window close.
    - Electron app communicates with daemon via local socket or SQLite polling.

12. **Message templates**
    - Add a `templates` table in SQLite.
    - Template picker in `ScheduleForm`.

13. **Export / import schedules**
    - Export all schedules as JSON.
    - Import from JSON (merge or replace).
    - Useful for backup before OS reinstall.

14. **Schedule preview / next-run display**
    - Show "Next run: Thu Mar 19 at 09:00" on each schedule row.
    - Requires computing next fire time from node-schedule RecurrenceRule.

15. **Conflict / overlap detection**
    - Warn if two schedules target the same phone number within a short window (e.g., 1 minute).

16. **Unit tests**
    - Add vitest.
    - Test: `db.service.ts` CRUD, `scheduler.service.ts` job registration logic, `applescript.ts` parsing, utility functions.

---

## Long-Term / Product Enhancements

17. **System tray / menu bar icon**
    - Use Electron `Tray` API.
    - Allow app to be hidden from Dock but remain running in menu bar.
    - Quick-access to "Next scheduled send" from tray menu.

18. **Multiple recipients per schedule**
    - Add recipients as an array in the schedule.
    - Requires sequential sends (one per recipient) to avoid overwhelming WhatsApp automation.

19. **Calendar view**
    - Visual month/week calendar showing upcoming scheduled messages.

20. **Log retention policy**
    - Auto-clear logs older than N days (configurable in Settings).
    - Currently only manual clear is available.

21. **Code signing + notarisation**
    - Add Apple Developer ID for distribution to other machines without Gatekeeper warning.
    - Required for sharing the app.

22. **Universal binary build**
    - Configure electron-builder for `"arch": ["x64", "arm64"]` or `"universal"` target.
    - Current build only targets the build machine's architecture.
