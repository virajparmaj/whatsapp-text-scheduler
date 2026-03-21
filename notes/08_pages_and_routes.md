# 08 — Pages and Routes

## Purpose
Map navigable UI surfaces and their data dependencies.

## Status
- **Confirmed from code**: app uses tab-state navigation, not URL routing.
- **Not found in repository**: React Router / Next.js style route definitions.

## Confirmed from code

### Navigation model
- Single-window shell in `src/App.tsx`.
- `activeTab` local state decides which page renders.
- Tabs: `dashboard`, `calendar`, `logs`, `settings`.

### Route map (tab map)
| Path / Route | Purpose | Auth needed? | Primary components | Data dependencies | Current status |
|---|---|---|---|---|---|
| `dashboard` (tab id) | Manage schedules (CRUD, toggle, duplicate, test send) | No | `Dashboard`, `ScheduleModal`, `ScheduleForm` | `schedule:*`, `schedule:getNextFireTimes`, `schedule:executed` | Implemented |
| `calendar` (tab id) | Visual recurrence calendar + create/edit from date cells | No | `CalendarPage`, `ScheduleModal` | schedules from context (backed by `schedule:*`) | Implemented |
| `logs` (tab id) | Execution history and clear/filter actions | No | `Logs` | `logs:*`, `schedule:executed` | Implemented |
| `settings` (tab id) | Runtime settings + permission checks | No | `Settings` | `settings:*`, `system:*`, `contacts:checkAccess`, `contacts:openSettings` | Implemented |

### Overlay flows (not routes)
- Schedule create/edit dialogs (`ScheduleModal`, `ExtendedScheduleDialog`).
- Dashboard inline confirmations (test-send live confirmation, delete confirmation).
- Logs clear confirmation.

## Inferred / proposed
- **Strongly inferred** URL routing is intentionally omitted because app is desktop-tab oriented.

## Important details
- No auth gates currently exist on any tab.
- Error boundary wraps the whole app to catch renderer crashes.

## Open issues / gaps
- No deep-linking to a specific tab/state.
- No persisted last-open tab between sessions.
- No route-level access model (not needed currently).

## Recommended next steps
1. Keep tab IDs stable since they function as internal route keys.
2. If deep-linking is needed later, introduce lightweight route state without breaking current tab UX.
