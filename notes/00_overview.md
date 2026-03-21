# 00 — Overview

## Purpose
Document what this repository actually ships today: a local macOS desktop scheduler for WhatsApp messages.

## Status
- **Confirmed from code** for all core runtime behavior.
- Current maturity: usable personal tool with real scheduling, persistence, logs, and settings.

## Confirmed from code
- Product type: Electron desktop app (`electron/main.ts`) with React renderer (`src/App.tsx`).
- Core capability: schedule WhatsApp messages and execute via `whatsapp://` URL + AppleScript Enter key automation (`electron/services/whatsapp.service.ts`).
- Scheduling engine: in-process `node-schedule` jobs (`electron/services/scheduler.service.ts`).
- Persistence: local SQLite via `better-sqlite3` (`electron/services/db.service.ts`).
- Supported recurrence: `one_time`, `daily`, `weekly`, `quarterly`, `half_yearly`, `yearly` (`shared/types.ts`, `scheduler.service.ts`).
- UI surface: tabbed app with Schedules, Calendar, Activity, Settings (`src/App.tsx`).
- No cloud/backend HTTP service and no account system in runtime code.

## Inferred / proposed
- **Strongly inferred** target user: single personal user on macOS who wants scheduled reminders/messages.
- **Strongly inferred** positioning: local-first privacy tool, not enterprise messaging infrastructure.

## Important details
- One-time missed schedules are marked `skipped` at startup and auto-disabled (`initScheduler`).
- One-time schedules auto-disable after execution attempt (success/failure/dry-run path completion).
- Global dry run setting can force all sends into non-sending mode.
- Main process emits `schedule:executed` and also shows native macOS notifications.

## Repo reality
| Area | Reality in this repo |
|---|---|
| Scheduling | Implemented and active in main process |
| Message delivery | Implemented via local UI automation |
| Logs/history | Implemented in SQLite + Activity tab |
| Calendar visualization | Implemented |
| Contacts lookup | Implemented via AppleScript to macOS Contacts |
| Authentication | Not implemented and not needed for current local single-user model |
| Cloud backend/API | Not found in repository |
| Automated tests | Not found in repository |

## Open issues / gaps
- App must remain running for scheduled jobs to fire (no background daemon/service).
- Automation depends on unlocked macOS session + granted Accessibility permissions.
- No retry/backoff pipeline for failed sends.

## Recommended next steps
1. Keep this file aligned to runtime behavior in `electron/services/*` when scheduler/send behavior changes.
2. Add tests for scheduler and DB layers before expanding features.
3. Add background execution strategy if reliability becomes a product requirement.
