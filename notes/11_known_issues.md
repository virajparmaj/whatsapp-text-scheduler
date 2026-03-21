# 11 — Known Issues

## Purpose
Track current risks/defects prioritized by severity using repository evidence.

## Status
- Issues below are either **Confirmed from code** or explicitly marked **Strongly inferred**.

## Critical

### 1) Scheduling stops when app is not running
- **Confirmed from code**: scheduler lives in main-process memory (`node-schedule` map).
- If app quits, timers are gone until relaunch.
- Impact: missed sends during downtime.

### 2) Automation requires unlocked/permissioned macOS session
- **Confirmed from code**: send path relies on System Events keystroke automation.
- Impact: scheduled sends can fail when locked, missing Accessibility permission, or WhatsApp not ready.

### 3) Contract mismatch for test send
- **Confirmed from code**: frontend expects `SendResult`; backend returns `RunLog | null` for `testSend`.
- Impact: runtime type unsafety and potentially incorrect UI handling.

## Medium

### 4) No retry/backoff on failed sends
- **Confirmed from code**: failures are logged and execution ends.
- Impact: transient failures require manual re-trigger.

### 5) Recurring missed-run replay not implemented
- **Confirmed from code**: one-time missed startup handling exists; recurring catch-up is absent.
- Impact: silent gap for recurring schedules while app is down/sleeping.

### 6) Duplicate schema source drift risk
- **Confirmed from code**: runtime schema in `db.service.ts` differs from `electron/db/schema.sql` coverage.
- Impact: documentation/migration confusion and future maintenance mistakes.

### 7) Settings update accepts arbitrary key strings
- **Confirmed from code**: IPC handler writes any key/value pair.
- Impact: accidental settings corruption or unsupported keys.

## Low

### 8) No automated tests in repository
- **Not found in repository**: test files/config.
- Impact: regressions more likely across scheduler/IPC/automation behavior.

### 9) Dark mode config is incomplete
- **Confirmed from code**: Tailwind dark mode enabled, but no dark token overrides defined.
- Impact: feature expectation mismatch, minor UX inconsistency.

### 10) Packaging/signing readiness unclear
- **Strongly inferred**: no code-signing/notarization config present.
- Impact: friction for distribution beyond local/personal usage.

## Inferred / proposed
- **Strongly inferred** reliability limits are acceptable for personal use but risky for users expecting guaranteed sends.

## Important details
- Main process does attempt wake resync, which helps but does not provide full missed-run reconciliation.
- Notifications are implemented, so visibility is better than log-only systems.

## Open issues / gaps
- No structured reliability SLO/guarantee documented for users.
- No installer preflight checks for permissions and WhatsApp readiness.

## Recommended next steps
1. Fix test-send contract mismatch immediately.
2. Define and implement retry/missed-run policy.
3. Consolidate schema source and tighten settings-key validation.
