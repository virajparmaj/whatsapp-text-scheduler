# 07 — User Flows

## Status

Confirmed from code.

---

## 1. First Launch

1. App opens. Electron creates window.
2. `initDb()` — creates SQLite file if missing, runs schema, adds migration columns.
3. `initScheduler()` — loads all enabled schedules from DB, registers node-schedule jobs.
4. React renderer loads. `useSchedules.refresh()` fetches schedule list (empty on first run).
5. **Settings tab**: User should check Accessibility permission immediately.
   - If not granted: banner with "Open System Settings" link.
   - User grants permission in macOS System Settings → Accessibility.
6. Dashboard shows empty state with "Create your first schedule" CTA.

**Gap**: No onboarding wizard. User must discover the Settings tab to check permissions.

---

## 2. Create a Schedule

1. User clicks "New Schedule" button in Dashboard.
2. `ScheduleModal` opens with empty `ScheduleForm`.
3. **Recipient**:
   - User types in contact search field (2+ chars → debounced 300ms → `contacts:search`).
   - Dropdown shows matching contacts. User clicks a contact.
   - Phone number and contact name auto-filled from contact record.
   - Or: user manually types a phone number in the phone field directly.
4. **Message**: User types message in textarea. Character count updates.
5. **Schedule Type**: User selects from dropdown:
   - `one_time` → datetime-local input appears. Must be in the future.
   - `daily` → time input appears.
   - `weekly` → time input + day-of-week select appears.
   - `quarterly` / `half_yearly` / `yearly` → "Configure" button appears.
     - Clicking "Configure" opens `ExtendedScheduleDialog`.
     - User picks month slot, day of month (1–28), time.
     - Dialog shows preview: "Every quarter on the 15th at 09:00".
     - User confirms. Dialog closes, form shows "Configured ✓".
6. **Dry Run**: Optional toggle (defaults off).
7. User clicks "Save".
8. Validation runs client-side:
   - Phone: 7+ digits with country code.
   - Message: non-empty.
   - one_time: must be in the future.
   - Extended: must be configured.
9. On success: `schedule:create` IPC → schedule saved to DB → job registered.
10. Modal closes. Schedule list refreshes.

---

## 3. Edit a Schedule

1. User clicks pencil icon on a schedule row.
2. `ScheduleModal` opens with `ScheduleForm` pre-filled.
3. User modifies any fields.
4. User clicks "Save".
5. `schedule:update` IPC → DB updated → existing job cancelled → new job registered.
6. Modal closes. List refreshes.

---

## 4. Duplicate a Schedule

1. User clicks copy icon on a schedule row.
2. New schedule created client-side with all fields copied except:
   - New nanoid generated.
   - `enabled = false` (disabled by default on duplicate — **strongly inferred**; avoids accidental sends).
3. `schedule:create` IPC called.
4. List refreshes. Duplicate appears.

---

## 5. Delete a Schedule

1. User clicks trash icon on a schedule row.
2. Inline confirmation appears: "Confirm Delete / Cancel".
3. User clicks "Confirm Delete".
4. `schedule:delete` IPC → DB deletes schedule + cascade-deletes all its logs → job cancelled.
5. List refreshes. Schedule gone.

**Gap**: Deleted schedules cannot be recovered. No soft-delete or confirmation modal.

---

## 6. Enable / Disable a Schedule

1. User clicks the toggle switch on a schedule row.
2. `schedule:toggle` IPC → DB updates `enabled` field → job registered or cancelled.
3. Status badge updates (Active ↔ Paused).

---

## 7. Test Send a Schedule

1. User clicks play icon on a schedule row.
2. `schedule:testSend` IPC triggered immediately (bypasses scheduled time).
3. Same execution path: URL scheme → delay → AppleScript.
4. Result shown as inline text below the action row: "✓ Sent" or "✗ Error: …".
5. Log entry created in `run_logs`.
6. `schedule:executed` event fires → `useLogs` refreshes.

---

## 8. View Activity Logs

1. User clicks "Activity" tab in sidebar.
2. `useLogs` fetches last 200 log entries (joined with contact name + message).
3. Table renders: Time, Contact, Message (truncated), Status badge, Error.
4. User can filter by status using tab buttons: All / Sent / Failed / Dry Run / Skipped.
5. Real-time: when a scheduled job fires while the user is on this tab, `schedule:executed` event triggers refresh.

---

## 9. Clear Logs

1. User clicks "Clear Logs" button in Activity tab.
2. Inline confirmation appears.
3. User confirms.
4. `logs:clear` IPC (no `olderThanDays` arg → clears all).
5. Log list refreshes to empty.

---

## 10. Manage Settings

1. User clicks "Settings" tab.
2. `useSettings` loads current settings from DB.
3. **Accessibility**: Button checks `system:checkAccessibility`. Shows ✓ or ✗ + link.
4. **Contacts Access**: Button checks `contacts:checkAccess`. Shows ✓ or ✗ + link.
5. **Global Dry Run**: Toggle switch. If ON, all schedules run in dry-run mode regardless of per-schedule setting.
6. **Default Country Code**: Text input (e.g. "+1"). Prepended in contact phone numbers.
7. **Send Delay**: Number input (ms). WhatsApp must fully open before Enter is pressed.
8. **WhatsApp App Name**: Text input. Matches exact macOS app name for AppleScript `tell application`.
9. Each field saves immediately on change (no explicit "Save" button — **strongly inferred** from `updateSetting` hook pattern).

---

## 11. Scheduled Send (Automatic)

This flow runs without user interaction:

1. node-schedule fires job at the configured time.
2. `executeJob(scheduleId)` runs in Electron main process.
3. Schedule fetched from DB. If `enabled = false`, logs `skipped` and exits.
4. `sendWhatsAppMessage()` called:
   a. Phone number cleaned.
   b. `open whatsapp://send?phone=...&text=...` executed.
   c. App waits `sendDelayMs` milliseconds.
   d. If dry-run: stops here, logs `dry_run`.
   e. If real send: `tell application "WhatsApp" to activate`, then `keystroke return`.
5. Result logged to `run_logs`.
6. If one-time schedule and success: auto-disabled in DB.
7. `schedule:executed` event sent to renderer if window is open.

**Known failure points**:
- Mac screen locked → AppleScript cannot interact with UI.
- WhatsApp not running → URL scheme may not open WhatsApp, Enter sent to wrong window.
- Send delay too short → Enter pressed before message text loaded.

---

## Incomplete / Mocked Flows

- **No notification on send**: User has no alert if a scheduled send succeeded or failed while the app is in the background. Only discoverable via Activity tab.
- **No onboarding**: No guided setup for first-time Accessibility permission grant.
- **No conflict detection**: Scheduling multiple messages to the same number at the same minute is allowed without warning.
