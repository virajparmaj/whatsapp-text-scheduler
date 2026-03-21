# 07 — User Flows

## Purpose
Describe real user flows and where they are complete vs incomplete.

## Status
- **Confirmed from code** for implemented flows below.
- Includes explicit notes for non-applicable flows (signup/login/admin).

## Confirmed from code

### 1) App open / landing
1. App initializes DB, IPC handlers, and scheduler in main process.
2. Window opens with sidebar tabs; default tab is Schedules.
3. Renderer loads schedules + next fire times through context refresh.

### 2) Create schedule
1. User opens New Schedule modal from Schedules tab or Calendar empty date.
2. User enters recipient (manual phone or Contacts search), message, schedule type.
3. For one-time: pick future datetime.
4. For daily/weekly: pick time/day.
5. For quarterly/half-yearly/yearly: configure recurrence via Extended Schedule dialog.
6. Optional dry-run toggle.
7. Submit -> IPC `schedule:create` -> DB insert -> job registration -> UI refresh + toast.

### 3) Edit schedule
1. User clicks edit on a schedule card or calendar event popover.
2. Modal opens with prefilled values.
3. Submit -> `schedule:update` -> DB update -> reschedule job -> refresh + toast.

### 4) Duplicate schedule
1. User clicks duplicate.
2. Frontend sends copied payload as new create request.
3. New schedule is inserted and shown after refresh.

### 5) Toggle enable/disable
1. User flips switch on schedule card.
2. `schedule:toggle` updates DB and registers/cancels in-memory job.

### 6) Manual test send
1. User clicks play icon.
2. If schedule dry-run is off, UI asks confirmation.
3. Confirm -> `schedule:testSend` executes same scheduler path.
4. Result logs to activity and triggers refresh event.

### 7) Calendar interaction
1. Calendar expands recurrence occurrences into visible month grid.
2. Click empty day -> create modal prefilled with selected date.
3. Click day with schedules -> popover list, then edit existing or add new.

### 8) Activity log flow
1. Activity tab loads latest logs.
2. User filters by status and can clear logs with confirmation.
3. Log list auto-refreshes when `schedule:executed` event arrives.

### 9) Settings flow
1. Settings tab loads app settings from DB.
2. User can check accessibility/contacts permission status.
3. User updates global dry-run, default country code, send delay, WhatsApp app name.
4. Settings save through immediate updates (switch or debounced input).

## Inferred / proposed
- **Strongly inferred** there is no account onboarding flow by design (single-user local app).

## Important details
- Signup/login flow: **Not found in repository**.
- Admin/profile flow: **Not found in repository**.
- Landing webpage/marketing route: **Not found in repository**.

## Open issues / gaps
- No first-run guided onboarding for required macOS permissions.
- Reliability gaps when app is closed or system is locked.
- No recurring missed-run replay/backfill.

## Recommended next steps
1. Add first-run checklist (permissions + WhatsApp readiness).
2. Add explicit UX for reliability constraints on creation screen.
3. Add retry/missed-run handling policy and expose in settings.
