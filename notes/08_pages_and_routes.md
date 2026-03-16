# 08 — Pages and Routes

## Status

Confirmed from code. There is no URL-based routing (no React Router, no Next.js pages). Navigation is tab-based — `activeTab` state in `src/App.tsx` controls which page component renders.

## Tab Map

| Tab ID | Label | Icon | Component | Auth Required | Data Dependencies | Status |
|---|---|---|---|---|---|---|
| `dashboard` | Schedules | `Calendar` | `src/pages/Dashboard.tsx` | No | `schedule:getAll`, `schedule:executed` event | Implemented |
| `logs` | Activity | `MessageSquare` | `src/pages/Logs.tsx` | No | `logs:getAll`, `schedule:executed` event | Implemented |
| `settings` | Settings | `Settings` | `src/pages/Settings.tsx` | No | `settings:getAll`, `system:checkAccessibility`, `contacts:checkAccess` | Implemented |

Default tab: `dashboard` (confirmed — `useState('dashboard')` in `App.tsx`).

---

## Component Details

### `src/pages/Dashboard.tsx`

**Purpose**: Primary schedule management view.

**Layout**:
- Header row: "Schedules" title + "New Schedule" button.
- Schedule list: one row per schedule.
- Empty state: message + "Create your first schedule" button.

**Per-row data shown**:
- Contact name (or phone number if no name)
- Phone number
- Schedule description (e.g., "Daily at 09:00", "Every Tuesday at 18:30", "One-time: Mar 20, 2026")
- Status badge (Active, Paused, Dry Run, Done)
- Action buttons: Play (test send), Edit, Duplicate, Delete

**Local state**:
- `modalOpen: boolean`
- `editingSchedule: Schedule | null`
- `confirmDeleteId: string | null`
- `testResult: { id: string; message: string } | null`

**Hooks**: `useSchedules`

---

### `src/pages/Logs.tsx`

**Purpose**: Read-only activity history.

**Layout**:
- Header row: "Activity Log" title + filter tabs + "Clear Logs" button.
- Table: Time | Contact | Message | Status | Error.
- Empty state per filter.

**Filter options**: All / Sent / Failed / Dry Run / Skipped (client-side filter on loaded logs).

**Local state**:
- `filter: RunStatus | 'all'`
- `confirmClear: boolean`

**Hooks**: `useLogs`

**Real-time**: `window.api.onScheduleExecuted` listener registered in `useLogs` triggers refresh on each execution event.

---

### `src/pages/Settings.tsx`

**Purpose**: App configuration and permission management.

**Sections**:
1. **Permissions** — Accessibility check, Contacts check, each with status + link button.
2. **Important Notes** — Warning box about requirements (app must stay running, WhatsApp must be open, etc.).
3. **App Settings** — Global Dry Run switch, Default Country Code, Send Delay, WhatsApp App Name.

**Local state**:
- `accessibilityStatus: AccessibilityStatus | null`
- `contactsAccess: boolean | null`

**Hooks**: `useSettings`

---

## Overlay Components

These are not pages/routes — they render on top of the active tab:

| Component | Trigger | Purpose |
|---|---|---|
| `ScheduleModal` + `ScheduleForm` | "New Schedule" or Edit button | Create / edit schedule |
| `ExtendedScheduleDialog` | "Configure" button inside ScheduleForm | Configure quarterly/half-yearly/yearly timing |
| Inline confirm (Dashboard) | Delete button | Confirm schedule deletion |
| Inline confirm (Logs) | Clear Logs button | Confirm log clearing |

---

## App Shell (`src/App.tsx`)

**Layout structure**:

```
<div class="flex h-screen overflow-hidden">
  <aside class="w-52 ...">          <!-- Sidebar -->
    App branding (WA Scheduler logo)
    Nav tabs: Dashboard / Activity / Settings
  </aside>
  <main class="flex-1 overflow-y-auto p-6">
    { activeTab === 'dashboard' && <Dashboard /> }
    { activeTab === 'logs'      && <Logs /> }
    { activeTab === 'settings'  && <Settings /> }
  </main>
</div>
```

**macOS-specific**: `body { padding-top: 2.5rem }` reserves space for the traffic-light controls (window.titleBarStyle = 'hiddenInset').
