# 13 — Prompt Context

## Purpose
Reusable context for future coding agents working on this repository.

## Status
- **Confirmed from code** baseline.
- Keep this file updated whenever architecture/contracts materially change.

## Confirmed from code

### What this app is
- Local macOS Electron utility that schedules WhatsApp messages.
- Uses local SQLite + in-process scheduler + AppleScript automation.
- No cloud backend, no account system, no web auth flow.

### Non-negotiable product goals
- Stay local-first and privacy-preserving.
- Preserve reliable scheduling behavior within app-runtime constraints.
- Keep UX simple for single-user operation.

### Stack summary
- Electron main/preload + React renderer (TypeScript).
- `better-sqlite3` for persistence.
- `node-schedule` for recurrence.
- Tailwind + local UI primitives.
- AppleScript via `osascript` for send automation and Contacts lookup.

### Architecture rules
- Use preload bridge (`window.api`) for renderer-main communication; no direct Node calls from renderer.
- Keep `shared/types.ts` as contract source for shared shapes.
- When changing DB fields, update: SCHEMA/migrations -> row mappers -> shared types -> IPC/preload -> renderer consumers.
- Preserve event-driven refresh behavior based on `schedule:executed`.

### Design rules
- Maintain current desktop shell pattern (sidebar + tab content).
- Reuse existing UI primitives and utility classes for consistency.
- Keep macOS traffic-light top padding behavior intact unless title bar model changes.

### Things to preserve
- Recurrence support across all 6 schedule types.
- One-time auto-disable and startup missed-one-time skip behavior.
- Dry-run semantics (schedule-level and global override).
- Local-only data model unless explicit product direction changes.

## Inferred / proposed
- **Strongly inferred** agents should prioritize reliability and contract correctness over feature breadth.

## Important details
- Known weak points today:
  - `testSend` contract mismatch between shared type and runtime return.
  - In-process scheduling requires app runtime availability.
  - Duplicate schema source drift risk.
- Nonexistent systems agents should not assume:
  - HTTP backend
  - Auth provider/session middleware
  - Cloud DB, RLS, or ML APIs

## Open issues / gaps
- No automated tests currently protect scheduling/IPC contracts.
- No formal migration version tracking.

## Recommended next steps for future agents
1. Start every task by validating current behavior against `electron/services/*` and `shared/types.ts`.
2. If changing contracts, update both types and runtime handlers in the same PR.
3. Run build checks before finishing (`npm run build`).
4. Avoid introducing cloud dependencies unless explicitly requested.
