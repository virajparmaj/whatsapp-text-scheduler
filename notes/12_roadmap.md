# 12 — Roadmap

## Purpose
Provide a practical, repo-specific plan of improvements aligned with current architecture.

## Status
- Roadmap items are **proposed**.
- Priorities are based on confirmed implementation gaps and risks.

## Confirmed from code
- Local-only Electron architecture (no external backend) is already implemented.
- Scheduler, DB, and IPC are functional but have reliability/contract hardening opportunities.
- Current gaps include test coverage absence and one known IPC/type mismatch (`testSend`).

## Immediate fixes (high impact)
1. Align `testSend` API contract across shared types, IPC, and UI handling.
2. Consolidate schema source of truth (runtime SCHEMA vs `electron/db/schema.sql`).
3. Add settings-key validation guard in `settings:update` handler.
4. Add explicit reliability notice in schedule creation UX (app running, permissions, unlocked session).

## Short-term improvements
1. Implement retry/backoff for failed sends with configurable limits.
2. Add recurring missed-run handling strategy (explicit skip logs or replay policy).
3. Add preflight diagnostics screen (Accessibility, Contacts, WhatsApp installed/running check).
4. Add automated tests for DB mapping, scheduler recurrence registration, and IPC boundaries.

## Medium-term improvements
1. Add import/export for schedules and settings.
2. Add template messages and faster schedule authoring flows.
3. Improve Calendar with execution-state overlays and drill-down history.
4. Harden packaging/release checks for native module compatibility on multiple architectures.

## Long-term enhancements
1. Optional background execution model (LaunchAgent/service mode).
2. Optional tray/menu-bar experience for always-on scheduling.
3. Optional signed/notarized distribution workflow for broader sharing.

## Inferred / proposed
- **Strongly inferred** roadmap should preserve local-first architecture unless explicit product expansion requires cloud services.

## Important details
- Current stack is well-suited for incremental hardening without major rewrites.
- Reliability and contract correctness are the highest leverage investments first.

## Open issues / gaps
- No explicit acceptance criteria/tracking system exists in repo for roadmap execution.

## Recommended next steps
1. Convert immediate fixes into tracked issues with owners and target dates.
2. Add a minimal test baseline before implementing larger feature work.
3. Revisit roadmap after reliability milestone completion.
