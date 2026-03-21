# 06 — API Contracts

## Purpose
Document the frontend/backend contract surface that exists in this repo.

## Status
- **Confirmed from code**: all runtime contracts are Electron IPC channels, not HTTP endpoints.
- **Not found in repository**: REST/GraphQL server, RPC gateway, ML inference API.

## Confirmed from code

### Contract type
- Renderer calls `window.api` methods exposed by preload (`electron/preload.ts`).
- Preload forwards to `ipcRenderer.invoke(...)` channels.
- Main handles channels in `electron/ipc/*.ipc.ts`.

### Schedule channels
- `schedule:getAll() -> Schedule[]`
- `schedule:get(id) -> Schedule | null`
- `schedule:create(input) -> Schedule`
- `schedule:update(id, patch) -> Schedule`
- `schedule:delete(id) -> void`
- `schedule:toggle(id, enabled) -> Schedule`
- `schedule:testSend(id) -> runtime returns RunLog | null (see mismatch note)`
- `schedule:getNextFireTimes() -> Record<string, string | null>`

### Logs channels
- `logs:getAll(limit?) -> RunLog[]`
- `logs:bySchedule(scheduleId) -> RunLog[]`
- `logs:clear(olderThanDays?) -> void`

### Settings/system channels
- `settings:getAll() -> AppSettings`
- `settings:update(key, value) -> void`
- `system:checkAccessibility() -> AccessibilityStatus`
- `system:openAccessibilityPrefs() -> void`

### Contacts channels
- `contacts:search(query) -> Contact[]`
- `contacts:checkAccess() -> AccessibilityStatus`
- `contacts:openSettings() -> void`

### Push event contract
- Main emits `schedule:executed` event to renderer with run-log payload.
- Hooks/context subscribe and refresh schedules/logs.

### Error behavior
- IPC handlers usually `throw` on failure; renderer promise rejects.
- Contacts search explicitly throws permission message for denied access codes.
- Send pipeline returns structured success/error object internally, but test-send path currently bypasses that shape at API boundary.

### Loading/timeout expectations
- Renderer sets local loading state before/after async IPC calls.
- AppleScript helper has default command timeout (10s) and contacts search uses explicit timeout values.

## Inferred / proposed
- **Strongly inferred** there is no need for external API gateway unless product scope expands beyond local desktop automation.

## Important details
- This app has an internal API surface (IPC), so contract quality still matters like any backend API.
- `shared/types.ts` is intended as contract source of truth but is currently inconsistent in one key method.

## Open issues / gaps
- **Confirmed from code** mismatch: `ElectronAPI.testSend` is typed as `Promise<SendResult>`, but backend returns `Promise<RunLog | null>` (`testSendSchedule -> executeJob`).
- `settings:update` key/value shape is fully open (no enum validation in handler).
- Error envelope is not standardized across channels.

## Recommended next steps
1. Align `testSend` return type and implementation contract.
2. Add typed success/error envelopes for all channels.
3. Restrict `settings:update` to allowed key set in handler.
