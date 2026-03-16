# 06 — API Contracts

## Status

Confirmed from code. There is no HTTP API. All "API" is Electron IPC between renderer and main process. Contracts are typed in `shared/types.ts` and enforced via TypeScript.

The renderer calls `window.api.*` (exposed by `electron/preload.ts` via `contextBridge`). Each call resolves to `ipcRenderer.invoke(channel, ...args)` and returns a Promise.

---

## IPC Channels

### Schedule Operations

#### `schedule:getAll`

```
Input:  none
Output: Schedule[]
```

#### `schedule:get`

```
Input:  id: string
Output: Schedule | undefined
```

#### `schedule:create`

```
Input: CreateScheduleInput {
  phoneNumber:   string        // required
  contactName?:  string        // optional display name
  message:       string        // required
  scheduleType:  ScheduleType  // 'one_time' | 'daily' | 'weekly' | 'quarterly' | 'half_yearly' | 'yearly'
  scheduledAt?:  string        // ISO 8601, one_time only
  timeOfDay?:    string        // "HH:mm", daily/weekly/extended
  dayOfWeek?:    number        // 0–6, weekly only
  dayOfMonth?:   number        // 1–28, quarterly/half_yearly/yearly
  monthOfYear?:  number        // 0–11, yearly only
  dryRun?:       boolean       // default false
}
Output: Schedule               // full record with id, timestamps
```

Side effect: If `enabled` is true (default), registers a node-schedule job immediately.

#### `schedule:update`

```
Input:  id: string, data: UpdateScheduleInput {
  phoneNumber?:  string
  contactName?:  string
  message?:      string
  scheduleType?: ScheduleType
  scheduledAt?:  string
  timeOfDay?:    string
  dayOfWeek?:    number
  dayOfMonth?:   number
  monthOfYear?:  number
  enabled?:      boolean
  dryRun?:       boolean
}
Output: Schedule
```

Side effect: Cancels and re-registers the schedule's job.

#### `schedule:delete`

```
Input:  id: string
Output: void
```

Side effect: Cancels job, cascade-deletes run_logs.

#### `schedule:toggle`

```
Input:  id: string, enabled: boolean
Output: Schedule
```

Side effect: Cancels job if disabling; registers job if enabling.

#### `schedule:testSend`

```
Input:  id: string
Output: void
```

Side effect: Immediately executes the schedule's job (same path as scheduled execution). Logs result. Fires `schedule:executed` event to renderer.

---

### Log Operations

#### `logs:getAll`

```
Input:  limit?: number  // default 200
Output: RunLog[] {
  id:           string
  scheduleId:   string
  status:       RunStatus   // 'success' | 'failed' | 'dry_run' | 'skipped'
  errorMessage: string | null
  firedAt:      string      // ISO 8601
  completedAt:  string      // ISO 8601
  contactName:  string      // joined from schedules table
  message:      string      // joined from schedules table
}
```

#### `logs:bySchedule`

```
Input:  scheduleId: string
Output: RunLog[]
```

#### `logs:clear`

```
Input:  olderThanDays?: number  // if omitted, clears all
Output: void
```

---

### Settings Operations

#### `settings:getAll`

```
Input:  none
Output: AppSettings {
  globalDryRun:       boolean
  defaultCountryCode: string   // e.g. "+1"
  sendDelayMs:        number   // e.g. 3000
  whatsappApp:        string   // e.g. "WhatsApp"
}
```

#### `settings:update`

```
Input:  key: string, value: string
Output: void
```

Valid keys: `'global_dry_run'`, `'default_country_code'`, `'send_delay_ms'`, `'whatsapp_app'`
All values are strings (the callers serialise booleans as `'0'`/`'1'`).

---

### System Operations

#### `system:checkAccessibility`

```
Input:  none
Output: AccessibilityStatus {
  granted: boolean
  error?:  string
}
```

Executes a test AppleScript to probe Accessibility permission. If denied, sets `granted: false` and includes the OS error string.

#### `system:openAccessibilityPrefs`

```
Input:  none
Output: void
```

Opens `x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility`.

---

### Contact Operations

#### `contacts:search`

```
Input:  query: string   // minimum 2 characters
Output: Contact[] {
  name:        string
  phoneNumber: string
  phoneLabel:  string   // e.g. "mobile", "home", "work"
}
```

Max 15 results. Returns `[]` if Contacts permission is denied (no error thrown).

#### `contacts:checkAccess`

```
Input:  none
Output: boolean   // true if Contacts permission is granted
```

#### `contacts:openSettings`

```
Input:  none
Output: void
```

Opens `x-apple.systempreferences:com.apple.preference.security?Privacy_Contacts`.

---

## Push Events (Main → Renderer)

#### `schedule:executed`

Fired by main process after every job execution (scheduled or manual test-send).

```
Payload: {
  scheduleId: string
  status:     RunStatus
  error?:     string
}
```

Renderer listeners registered via `window.api.onScheduleExecuted(callback)`. Used by `useSchedules` and `useLogs` hooks to trigger refresh without polling.

---

## Error Handling

- IPC handlers in `electron/ipc/*.ts` are not wrapped in try/catch (confirmed from code). Unhandled exceptions in handlers will reject the renderer-side Promise with a generic Electron IPC error.
- `whatsapp.service.ts` and `applescript.ts` do catch errors internally and return structured error results rather than throwing.
- No IPC input validation beyond TypeScript types — malformed inputs are not explicitly rejected in handlers.
