# 11 — Known Issues

## Purpose
Track current risks/defects prioritized by severity using repository evidence.

## Status
Last updated: 2026-03-30

## Critical

### 1) Scheduling stops when app is not running
- **Status:** Mitigated
- Scheduler lives in main-process memory (`node-schedule` map).
- **Mitigations now in place:**
  - Window hides on close (scheduler stays running via tray icon)
  - Start-at-login setting (`app.setLoginItemSettings` with `openAsHidden`)
  - Sleep/wake resync rebuilds all jobs and catches missed runs
  - Single instance lock prevents duplicate processes
  - Uncaught exception handlers prevent silent crashes
- **Remaining risk:** if process is force-killed, schedules are lost until next launch.

### 2) Automation requires unlocked/permissioned macOS session
- **Status:** Known limitation (inherent to AppleScript approach)
- Send path relies on System Events keystroke automation.
- Screen lock detection skips sends gracefully (logged as `skipped`).
- Accessibility permission check available in Settings tab.

### 3) Contract mismatch for test send
- **Status:** FIXED
- Backend `testSend` handler now converts `RunLog` to `SendResult` format at the IPC boundary.
- Frontend receives `{ success, error?, dryRun }` as expected.

### 11) Group messaging: search bar targeting was broken
- **Status:** FIXED (commits c1c1c84, b768721)
- Original code used `Cmd+F` which opened WhatsApp's in-chat message search, not the sidebar search.
- Group name was typed into the wrong field — navigation to the group never happened.
- Fix: added double-Escape reset phase (Phase 1) to clear stale dialogs, then uses `Cmd+F` to open sidebar search (Phase 2), arrow-down navigation to select result (Phase 4), and clipboard paste for message (Phase 5).
- Current flow is 6 phases with structured per-phase logging for debugging.

### 12) Group messaging: inherent UI automation fragility
- **Status:** Known limitation (inherent to AppleScript approach)
- Group sends require 6-phase UI automation (~5+ seconds of active UI control).
- **AX path fragility:** Element paths (`text field 1 of group 1 of window 1`) are WhatsApp-version-dependent. May break on WhatsApp updates.
- **Wrong-chat risk:** No post-selection verification. If search returns a contact instead of the group, message goes to the wrong recipient.
- **Timing dependency:** Fixed `sendDelayMs` wait (3000ms) between search typing and result selection. Fails if WhatsApp is slow to populate results.
- **Reliability ceiling:** ~85-90% for personal use. Cannot guarantee correct group targeting.
- **Mitigations in place:** feature-flagged (off by default), auto dry-run for new group schedules, staggered catch-ups (8s apart), structured phase logging.
- **Recommended next hardening step:** add post-selection chat verification (read AX chat header, compare to group name, abort on mismatch).

## Medium

### 4) No retry/backoff on failed sends
- **Status:** FIXED
- Exponential backoff implemented: 10s → 30s → 90s (configurable `max_retries`).
- Non-retryable errors (Accessibility, screen lock) excluded from retry.
- Retry metadata tracked in `run_logs` (retry_attempt, retry_of columns).

### 5) Recurring missed-run replay not implemented
- **Status:** FIXED
- `detectAndCatchUpMissedRuns()` fires one immediate catch-up execution per missed recurring schedule on startup/wake.
- Uses `getMostRecentExpectedFire()` to compute what should have fired.

### 6) Duplicate schema source drift risk
- **Status:** Resolved
- Single source of truth is the `SCHEMA` constant in `db.service.ts`.
- No separate `schema.sql` file exists — migrations use ALTER TABLE with try/catch.

### 7) Settings update accepts arbitrary key strings
- **Status:** FIXED
- `VALID_SETTINGS_KEYS` whitelist enforced in `updateSetting()`.
- Invalid keys throw an error.

## Low

### 8) No automated tests in repository
- **Status:** FIXED
- 19+ tests across scheduler logic, IPC contracts, and type mapping.
- IPC input validation tests added.

### 9) Dark mode styling is incomplete
- **Status:** Partially addressed — design debt remains
- Theme picker added to Settings (system/light/dark) and persisted in DB.
- Tailwind dark mode enabled, but dark token overrides (colors, borders, backgrounds) are not fully defined.
- Light mode is fully styled; dark mode will show unstyled/inverted elements.

### 10) Packaging/signing readiness unclear
- **Status:** Improved
- `asarUnpack` configured for `better-sqlite3` native module.
- `extraResources` configured for tray/app icons.
- Resource paths resolve correctly in both dev and packaged builds.
- Code signing/notarization still not configured (acceptable for personal distribution).

## Remaining risks
- Force-killed process = lost schedules until relaunch.
- AppleScript automation depends on WhatsApp Desktop UI stability.
- Group messaging can send to wrong chat if group name matches a contact name (no verification yet).
- No structured reliability SLO documented for users.
