# WhatTime — UX/Product Audit & Improvement Plan

## Context

This is a comprehensive UX/product audit of a local-first macOS Electron app for WhatsApp message scheduling. The app works (Electron 33 + React 18 + SQLite + node-schedule + AppleScript automation) and has solid reliability foundations (sleep/wake resync, retry backoff, tray runtime). The goal is to move from "works for the builder" to "works effortlessly for daily use" — fixing real friction, adding missing guardrails, and planning a path to data safety.

---

## 1) Current-State Snapshot

1. **Functional local scheduler** — 6 recurrence types, in-process node-schedule, AppleScript send via `whatsapp://send` + `keystroke return`. Works.
2. **Sleep/wake resync** — `powerMonitor.resume` cancels and re-registers all jobs, catches up missed recurring runs (one-shot per schedule). Solid.
3. **Close-to-tray + start-at-login** — Window hides on close, tray icon persists, single-instance lock prevents duplicates. Good lifecycle.
4. **Retry with exponential backoff** — 10s → 30s → 90s, non-retryable errors excluded. `max_retries` now controllable from Settings UI. ✅
5. **Dashboard search + sort** — Search bar filters on contact name, phone, message; sort dropdown (next fire, A–Z, created, updated). ✅
6. **Calendar shows planned fires only** — Green/yellow/gray dots for schedule state, but **no execution outcome overlay** (success/failure per day).
7. **Activity Logs have basic status filter** — No date range, no per-schedule drill-down, no pagination (hardcoded 200 limit), truncated error messages.
8. **Keyboard shortcut `Cmd+N`** for new schedule added. ✅
9. **No first-run onboarding** — Users land on empty dashboard, may create a schedule before granting Accessibility permission → cryptic failure on first send.
10. **Theme picker added to Settings** (system/light/dark). Dark mode CSS tokens still incomplete — `.dark` CSS variable set not defined; toggle exists but appearance is unstyled.
11. **Conflict detection implemented** — `schedule:checkConflicts` warns on duplicate recipient + fire time before save. ✅
12. **No undo for destructive actions** — Delete is permanent (CASCADE wipes run_logs). 2-stage confirm exists but no soft-delete/undo.
13. **No message templates** — Users re-type identical messages across yearly birthday schedules.
14. **No export/import/backup** — Single point of failure: one SQLite file, no way to back up or migrate.
15. **App stops scheduling if force-killed** — No LaunchAgent keepalive. Scheduler lives only in Electron process memory.
16. **Experimental group scheduling added** — `enableGroupScheduling` setting gates group mode; uses UI automation (search + clipboard). Less reliable than contact sends. ✅

---

## 2) UX + Efficiency Audit Table

| # | Area | Status | Current Issue / Fix | Sev | Effort |
|---|------|--------|---------------------|-----|--------|
| 1 | Dashboard | ✅ DONE | Search bar + sort dropdown added (`Dashboard.tsx`) | H | S |
| 2 | Onboarding | ❌ TODO | No first-run guidance → users fail on first send (missing Accessibility) | H | S |
| 3 | Reliability | ❌ TODO | No LaunchAgent keepalive → force-kill stops scheduler | H | M |
| 4 | Dashboard | ❌ TODO | No bulk operations → pausing multiple schedules = N clicks | H | M |
| 5 | Safety | ✅ DONE | Conflict detection via `schedule:checkConflicts` in `ScheduleForm.tsx` | M | M |
| 6 | Calendar | ❌ TODO | No execution outcome overlay — dots show plan, not results | M | M |
| 7 | Logs | ❌ TODO | No date range or schedule filter; hardcoded 200 limit | M | M |
| 8 | Settings | ✅ DONE | `max_retries` numeric input (1–10) added to `Settings.tsx` | M | S |
| 9 | Dark mode | ❌ TODO | Theme toggle added; `.dark` CSS token set still not defined in `index.css` | M | S |
| 10 | Keyboard | ✅ DONE | `Cmd+N` opens new schedule modal | M | S |
| 11 | Delete safety | ❌ TODO | No undo — delete is permanent (CASCADE wipes logs) | M | M |
| 12 | Productivity | ❌ TODO | No message templates for repeated messages | L | M |
| 13 | Logs | ❌ TODO | Retry chain (`retry_attempt`/`retry_of`) fields exist but not rendered | L | S |
| 14 | Diagnostics | ❌ TODO | No per-schedule health view for debugging send failures | M | L |

---

## 3) UI Improvements (Screen-by-Screen)

### Dashboard (`src/pages/Dashboard.tsx`)

**Implemented:**
- ✅ Search bar filters on `contactName`, `phoneNumber`, `message`
- ✅ Sort dropdown — "Next fire" | "Contact A–Z" | "Recently created" | "Recently updated"
- ✅ `Cmd+N` opens ScheduleModal

**Remaining issues:**
- No "View history" link from card to Logs filtered by schedule
- No compact/table view toggle for 20+ schedules
- No "Today summary" card
- Bulk operations (pause/resume/delete multiple) not implemented

---

### Calendar (`src/pages/Calendar.tsx`)

**Top usability issues:**
- Shows plan, not outcomes — can't see which days had failures
- Daily schedules fill every cell with identical green dots — visual noise
- Popover positioning uses manual rect math — can overflow viewport

**Proposed UI changes:**
1. **Execution outcome overlay** — New IPC `logs:getByDateRange(start, end)` returning aggregated status per day. Red "x" badge on failure days, green checkmark on success days.
2. **Daily schedule bar** instead of 30 individual dots — horizontal green bar with red segments on failure days
3. **"Today's upcoming" panel** below calendar — schedules firing today with countdown timers
4. **Fix popover** — use `position: fixed` with viewport boundary clamping

**Keyboard/accessibility:**
- Arrow keys navigate between cells
- `Enter` opens popover or create modal
- `Escape` closes popover

**Expected impact:** Calendar becomes a monitoring tool, not just a planning view.

---

### Activity / Logs (`src/pages/Logs.tsx`)

**Top usability issues:**
- Flat 200-entry list with only status filter
- No date range filtering
- Error messages truncated to 200px, right-aligned — hard to read
- `retry_attempt` and `retry_of` data exists but not rendered

**Proposed UI changes:**
1. **Date range quick-select** — Today | Last 7 days | Last 30 days | Custom picker
2. **Schedule filter dropdown** — populated from schedules list, pre-selectable via Dashboard "View history" link
3. **Retry chain rendering** — indented sub-entries for retries with "Retry 1/3" labels
4. **Full error display** — collapsible red banner below entry with full text, not truncated corner
5. **"Re-run" button** on failed entries — calls `testSend` for the associated schedule
6. **Export to CSV** — download visible entries for debugging

**Keyboard/accessibility:**
- Filter controls keyboard-navigable
- Log entries: `role="article"` with descriptive aria-labels

**Expected impact:** Debugging drops from "scan 200 entries" to "filter + 2 clicks."

---

### Settings (`src/pages/Settings.tsx`)

**Implemented:**
- ✅ `max_retries` numeric input (1–10)
- ✅ Theme picker (system / light / dark) — toggle works; `.dark` CSS tokens still needed
- ✅ Group scheduling toggle (`enable_group_scheduling`)
- ✅ Developer "Rebuild App" button

**Remaining issues:**
- No About section (app version, DB path, stats)
- No export/import buttons
- Dark mode toggle exists but appearance is unstyled (`.dark` CSS variable set missing)

---

## 4) Workflow Improvements

### Flow 1: First-Run Onboarding

**Current pain:** User installs → empty dashboard → creates schedule → send fails because Accessibility permission not granted. Trust broken on first interaction.

**Better flow:**
1. On launch, if `schedules` table empty AND `onboarding_completed !== '1'`: show wizard modal
2. **Step 1 — Welcome**: "WhatTime automates sending WhatsApp messages at times you choose."
3. **Step 2 — Permissions**: Inline Accessibility check. Green ✓ if granted, CTA "Grant Permission" → `openAccessibilitySettings()`. Poll every 2s. Cannot proceed until granted. Optional Contacts check.
4. **Step 3 — First Schedule**: Embedded `ScheduleForm` with dry-run pre-checked. "Create a test schedule to verify everything works."
5. **Step 4 — Success**: Dry-run test send succeeds → "You're all set!"
6. Set `onboarding_completed = '1'`

**Edge cases:**
- User dismisses wizard → persistent banner "Setup incomplete" with "Resume setup" button
- Accessibility revoked later → periodic check (every 5 min) with tray notification
- User skips to step 3 → validation catches missing fields, test send fails with informative error

**Files:** New `src/components/OnboardingWizard.tsx`, `src/App.tsx`, `electron/services/db.service.ts` (new setting key)

---

### Flow 2: Create/Edit Schedule

**Current pain:** Extended types (quarterly/half_yearly/yearly) require opening a separate `ExtendedScheduleDialog`. No preview of next fire times. No template reuse.

**Better flow:**
1. **Inline extended fields** — show month/day/time directly in `ScheduleForm.tsx` when type is quarterly/half_yearly/yearly. Remove `ExtendedScheduleDialog.tsx`.
2. **"Next 3 fires" preview** — below schedule config, compute using new IPC `schedule:previewFireTimes` (build rule, call `job.nextInvocation()` 3x without registering)
3. **Template picker** — dropdown above message textarea. Selecting fills textarea.
4. **Edit diff summary** — on update, show "Changed: time 09:00 → 10:00" before confirming

**Edge cases:** Already handled — past date validation, day clamped to 28, country code auto-fill on focus.

---

### Flow 3: Failure Handling/Recovery

**Current pain:** Failure → macOS notification with brief error → user opens app → switches to Activity → scans 200 entries. No clear retry path.

**Better flow:**
1. **Actionable notifications** — failure notification includes "Retry Now" action button (Electron `Notification` with actions on macOS)
2. **Rich failure entries** — full error message (collapsible), retry chain visualization, "Retry" button calling `testSend`, "Diagnose" expandable section (screen locked? WhatsApp running? Accessibility granted?)
3. **Auto-pause on consecutive failures** — if last 3 consecutive runs of a recurring schedule failed, auto-disable + notify: "Schedule for {contact} paused after 3 failures. Check your setup."

**Edge cases:**
- Screen locked → logged as "skipped" (correct), diagnostics shows "Screen was locked"
- WhatsApp not installed → pre-flight check on app launch, warn via tray notification
- Retry of a retry → already tracked via `retryOf` field

---

### Flow 4: Daily Monitoring

**Current pain:** No at-a-glance "how did today go?" — must check Dashboard for upcoming, Calendar for visual, Logs for outcomes. Three tabs for one question.

**Better flow:**
1. **"Today" summary card** at top of Dashboard — "3 sent, 1 failed, 2 upcoming today." Click to expand.
2. **Tray tooltip** — "WhatTime — 3 sent today, 1 failed" instead of static title
3. **Tray icon badge** — green (all good) / red dot (failures today) via `tray.setImage()` variant

**Edge cases:**
- No schedules today → "No messages scheduled for today"
- All dry run → "2 dry runs completed today"

---

## 5) Feature Opportunities (WhatsApp Scheduling POV)

### Reliability

| Feature | User Problem | Feas. | Complexity | Dependencies | Priority |
|---------|-------------|-------|------------|--------------|----------|
| LaunchAgent keepalive | Scheduler dies on force-kill/crash | A | M | macOS launchd plist, `launchctl` registration | 5 |
| Pre-flight health check | No way to verify system readiness before critical send | A | S | New IPC `system:healthCheck` → { accessibility, whatsappInstalled, screenUnlocked } | 4 |
| Consecutive failure auto-pause | Recurring schedule fails silently forever | A | S | Counter in `scheduler.service.ts`, threshold check after each failure | 4 |
| WhatsApp process watcher | App doesn't know if WhatsApp crashed mid-send | A | M | `pgrep WhatsApp` poll every 30s | 2 |
| Delivery confirmation | No way to know if message was actually delivered | B | L | WhatsApp Business API with read receipts | 1 |

### Productivity

| Feature | User Problem | Feas. | Complexity | Dependencies | Priority |
|---------|-------------|-------|------------|--------------|----------|
| Message templates | Re-typing identical messages | A | M | New `message_templates` table, CRUD, picker in form | 4 |
| Bulk import from CSV | 20 birthday schedules one by one | A | M | CSV parser, validation, batch create IPC | 3 |
| Schedule tags/groups | No organization by purpose | A | M | New `tags` column or junction table, filter on Dashboard | 3 |
| Quick duplicate with date bump | Duplicate copies same date (useless for one-time) | A | S | Modify `handleDuplicate` in `Dashboard.tsx` to add 1 week | 3 |
| Contact groups / multi-recipient | Send same message to N contacts on one schedule | A | L | New `schedule_recipients` table, sequential send with delays | 2 |

### Safety / Guardrails

| Feature | User Problem | Feas. | Complexity | Dependencies | Priority |
|---------|-------------|-------|------------|--------------|----------|
| Conflict detection | Same phone + same time = duplicate message | A | M | Pre-save SQL overlap query, warning in form | 5 |
| Rate limiting queue | 50 messages in 1 min → WhatsApp anti-spam | A | S | In-memory queue in `scheduler.service.ts`, configurable min-interval (default 30s) | 4 |
| Soft delete + undo | Accidental delete = permanent | A | M | `deleted_at` column, undo toast, auto-purge cron | 4 |
| Message length warning | WhatsApp may truncate >4096 chars | A | S | Warning badge in `ScheduleForm.tsx` at 4096 chars | 3 |
| Quiet hours | 3 AM sends wake recipients | A | S | Settings: quiet_hours_start/end, scheduler defers | 2 |

### Analytics / Insights

| Feature | User Problem | Feas. | Complexity | Dependencies | Priority |
|---------|-------------|-------|------------|--------------|----------|
| Success rate widget | No aggregate reliability view | A | M | SQL aggregation, new Dashboard component | 3 |
| Per-schedule sparkline | No visual reliability trend | A | M | Last 30 runs as mini bar chart on card | 2 |
| Export logs to CSV | Can't share debugging data | A | S | Format `run_logs` join → CSV, `dialog.showSaveDialog` | 3 |
| Weekly digest notification | No proactive summary | A | M | Scheduled weekly check, native Notification with stats | 2 |

---

## 6) Sync Strategy (Phased)

### Option 1: Manual Export/Import (Ship First)

**Architecture:** Two IPC endpoints in new `electron/ipc/data.ipc.ts`:
- `data:export` → reads all schedules + settings from SQLite, serializes to `{ version: 1, exportedAt, checksum: sha256, schedules: [...], settings: {...} }`
- `data:import` → validates JSON schema, runs in transaction. User chooses "Merge (skip existing IDs)" or "Replace all."

**Conflict strategy:** Merge uses schedule `id` as dedup key. Colliding IDs with different content → skip + log warning.

**Security/privacy:** Plain JSON. Warn user: "This file contains phone numbers and messages. Store securely." No encryption (rely on macOS disk encryption).

**UI:** Two buttons in Settings: "Export Data" → `dialog.showSaveDialog`, "Import Data" → `dialog.showOpenDialog`.

**Rollout:** First. Unblocks backup immediately.

---

### Option 2: Auto-Backup to User Folder (Ship Second)

**Architecture:** On every schedule create/update/delete, write full export JSON to `~/Library/Application Support/WhatTime/backups/backup-{ISO-timestamp}.json`. Keep last 10, prune older on startup.

**Conflict strategy:** N/A — write-only snapshots. Restore = Phase 1 import with "Replace all."

**Security/privacy:** Files in macOS-protected app support dir (chmod 700). Settings toggle "Auto-backup: On/Off."

**Rollout:** Second. Depends on Phase 1 export format being stable.

---

### Option 3: True Multi-Device Sync (Ship Third — Future)

**Architecture:** iCloud Drive file sync — write export JSON to `~/Library/Mobile Documents/com~veer~wa-scheduler/`. Other devices read on launch, compare `updated_at` timestamps.

**Conflict strategy:** Per-record last-write-wins via `updated_at`. Conflicting edits (same schedule ID, both modified since last sync) → surface diff view to user.

**Security/privacy:** iCloud provides E2E encryption. Phone numbers transit Apple infrastructure.

**Rollout:** Third. Only after Phase 1 + 2 are stable. Needs extensive edge-case testing (offline edits on two devices, partial sync).

---

## 7) Prioritized Roadmap

### Quick Wins (1–2 weeks)

| # | Item | Rationale | Files |
|---|------|-----------|-------|
| 1 | Dashboard search + sort | Highest ROI/effort. Pure frontend. Unblocks daily use at 10+ schedules. | `src/pages/Dashboard.tsx` |
| 2 | max_retries Settings UI | One-liner. Closes documented gap. | `src/pages/Settings.tsx` |
| 3 | Dark mode | Infrastructure ready. Only CSS vars + toggle. <2h. | `src/index.css`, `src/pages/Settings.tsx`, `electron/services/db.service.ts` |
| 4 | Keyboard shortcuts | `Cmd+N`, `Escape`, `Cmd+,`. Register in `App.tsx` `useEffect`. | `src/App.tsx` |
| 5 | Conflict detection warning | Simple pre-save SQL query + yellow banner in form. Prevents duplicate sends. | `electron/ipc/schedule.ipc.ts`, `src/components/ScheduleForm.tsx` |

### Near Term (1–2 months)

| # | Item | Files |
|---|------|-------|
| 6 | First-run onboarding wizard | New `src/components/OnboardingWizard.tsx`, `src/App.tsx` |
| 7 | Soft delete + undo toast | `electron/services/db.service.ts`, `electron/ipc/schedule.ipc.ts`, `src/pages/Dashboard.tsx` |
| 8 | Calendar execution overlay | `electron/ipc/logs.ipc.ts`, `src/pages/Calendar.tsx` |
| 9 | Logs date range + schedule filter + pagination | `src/pages/Logs.tsx`, `src/hooks/useLogs.ts`, `electron/ipc/logs.ipc.ts` |
| 10 | Message templates | `electron/services/db.service.ts`, new `electron/ipc/templates.ipc.ts`, `src/components/ScheduleForm.tsx` |
| 11 | Manual export/import (Sync Phase 1) | New `electron/ipc/data.ipc.ts`, `src/pages/Settings.tsx` |

### Longer Term (2+ months)

| # | Item | Files |
|---|------|-------|
| 12 | LaunchAgent keepalive | New `electron/utils/launchagent.ts`, `electron/main.ts` |
| 13 | Rate limiting send queue | `electron/services/scheduler.service.ts` |
| 14 | Bulk operations (select mode) | `src/pages/Dashboard.tsx`, `electron/ipc/schedule.ipc.ts` |
| 15 | Auto-backup (Sync Phase 2) | `electron/services/db.service.ts` |
| 16 | Diagnostics panel | New `src/components/DiagnosticsPanel.tsx`, new IPC endpoints |

### Top 5 Next Actions

1. **Dashboard search + sort** — Highest ROI/effort ratio. Pure frontend, no backend. Unblocks daily use past 10 schedules.
2. **Dark mode** — Infrastructure is ready. Only CSS variables + toggle. Visible quality-of-life win.
3. **First-run onboarding** — Prevents the most common first-time failure (missing Accessibility permission).
4. **max_retries Settings UI** — Trivial. Closes a documented gap. No reason not to ship immediately.
5. **Conflict detection warning** — Prevents the most dangerous user error (duplicate sends). Simple SQL query + warning UI.

---

## 8) Metrics and Validation Plan

### UX Speed Targets

| Metric | Baseline | Target | How to Measure |
|--------|----------|--------|----------------|
| Time to find a schedule (20 schedules) | ~15s (visual scan) | <2s (search) | Manual task timing |
| Time to create a schedule (returning user) | ~45s (mouse-only) | <30s (keyboard shortcuts) | Stopwatch from `Cmd+N` to toast |
| Time to diagnose a failure | ~60s (open → Logs → scan) | <15s (filter + expand) | Manual task timing |
| Keyboard-only task completion | Impossible | Possible for all core flows | Manual testing |

### Reliability Targets

| Metric | Target | SQL Query |
|--------|--------|-----------|
| Send success rate (30-day) | >98% | `COUNT(status='success') / COUNT(status IN ('success','failed'))` |
| Missed schedule rate | <1% | `COUNT(status='skipped') / total fires` |
| Mean retry count (successful retries) | <1.5 | `AVG(retry_attempt) WHERE status='success' AND retry_attempt > 0` |
| Scheduler uptime | >99.5% | Track in logs: time between `initScheduler` and shutdown |

### Adoption/Usage Metrics (Local Only)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Active schedule count | Trending up | `COUNT(*) WHERE enabled=1` on launch |
| Search feature adoption | >30% of sessions within 2 weeks | Local counter in `analytics` table |
| Onboarding completion rate | >90% | `settings.onboarding_completed = '1'` |

### Accessibility Conformance

| Check | Method | Criteria |
|-------|--------|----------|
| Color contrast | Manual inspection (light + dark) | WCAG AA: 4.5:1 text, 3:1 large text |
| Keyboard navigation | Tab through all elements | All interactive elements reachable, focus rings visible |
| Screen reader | VoiceOver on macOS | Cards, buttons, status badges announce meaningful labels |
| Focus management | Modal open/close | Focus trapped in modal, returns to trigger on close |

### Regression Guardrails

| Guard | Implementation | Trigger |
|-------|---------------|---------|
| Type safety | `npm run build` (strict TS) | Every commit |
| Unit tests | `vitest run` (existing 4 test files) | Every commit; expand to new IPC handlers |
| IPC contract tests | Existing `tests/ipc-contracts.test.ts` | Every commit; add for new endpoints |
| Scheduler logic tests | Existing `tests/scheduler.logic.test.ts` | Every commit; add conflict detection, rate limiting |
| Manual smoke test | Create → test send (dry) → verify log → toggle → delete → calendar check | Before every `npm run dist` |
| Bundle size | `npm run build` output | Flag chunks >500kB |
