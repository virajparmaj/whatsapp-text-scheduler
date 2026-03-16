# 03 — Architecture

## Status

Confirmed from code.

## Stack

| Layer | Technology | Version |
|---|---|---|
| Desktop framework | Electron | 33.0.0 |
| Build tool | electron-vite + Vite | 4.0.1 / 5.4.0 |
| Frontend | React + TypeScript | 18.3.1 / 5.7.0 |
| Styling | Tailwind CSS + shadcn/ui | 3.4.19 |
| Database | SQLite via better-sqlite3 | 12.8.0 |
| Scheduling | node-schedule | 2.1.1 |
| Automation | AppleScript via child_process (`osascript`) | — |
| Packaging | electron-builder | 26.8.1 |
| Icons | lucide-react | 0.460.0 |
| ID generation | nanoid | 3.3.11 |
| Date utilities | date-fns | 4.1.0 |

## Process Architecture

Electron has two processes. This app uses both.

```
┌─────────────────────────────────────────────────────────────┐
│                     MAIN PROCESS (Node.js)                  │
│                                                             │
│  electron/main.ts                                           │
│    ├── initDb()        → better-sqlite3 (WAL mode)         │
│    ├── registerHandlers()  → IPC handler registration       │
│    ├── initScheduler() → node-schedule (in-process cron)    │
│    └── createWindow()  → BrowserWindow                      │
│                                                             │
│  electron/services/                                         │
│    ├── db.service.ts     → SQLite CRUD                      │
│    ├── scheduler.service.ts → Job map, execution logic      │
│    └── whatsapp.service.ts  → URL scheme + AppleScript      │
│                                                             │
│  electron/ipc/                                              │
│    ├── schedule.ipc.ts  → schedule:* handlers              │
│    ├── logs.ipc.ts      → logs:* handlers                  │
│    ├── settings.ipc.ts  → settings:*, system:* handlers    │
│    └── contacts.ipc.ts  → contacts:* handlers              │
│                                                             │
│  electron/utils/applescript.ts                              │
│    └── runAppleScript() / runCommand()                      │
└────────────────────────┬────────────────────────────────────┘
                         │  Electron IPC (ipcMain / ipcRenderer)
                         │  Exposed via contextBridge in preload
                         │  Channel names: schedule:*, logs:*,
                         │    settings:*, system:*, contacts:*
                         │  Events: schedule:executed (main → renderer)
┌────────────────────────▼────────────────────────────────────┐
│                  RENDERER PROCESS (React)                   │
│                                                             │
│  src/main.tsx → src/App.tsx                                 │
│                                                             │
│  Pages:                                                     │
│    ├── Dashboard.tsx   → schedule list + CRUD UI            │
│    ├── Logs.tsx        → activity log + filter              │
│    └── Settings.tsx    → settings + permission checks       │
│                                                             │
│  Components:                                                │
│    ├── ScheduleModal.tsx + ScheduleForm.tsx                 │
│    ├── ExtendedScheduleDialog.tsx                           │
│    └── StatusBadge.tsx + ui/* (shadcn/ui)                   │
│                                                             │
│  Hooks:                                                     │
│    ├── useSchedules.ts                                      │
│    ├── useLogs.ts                                           │
│    └── useSettings.ts                                       │
│                                                             │
│  lib/ipc.ts → window.api (ElectronAPI)                      │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User action (React UI)
  → api.createSchedule(data)           [lib/ipc.ts → window.api]
  → ipcRenderer.invoke('schedule:create', data)
  → ipcMain handler in schedule.ipc.ts
  → db.service.ts.createSchedule()     [SQLite write]
  → scheduler.service.ts.registerJob() [node-schedule job]
  → returns Schedule object
  → UI refreshes via useSchedules.refresh()

Scheduled job fires (node-schedule)
  → scheduler.service.ts.executeJob(scheduleId)
  → db.service.ts.getScheduleById()
  → whatsapp.service.ts.sendWhatsAppMessage()
      → runCommand('open', ['whatsapp://send?...'])
      → sleep(sendDelayMs)
      → runAppleScript('tell application "WhatsApp" to activate ...')
  → db.service.ts.insertRunLog(status)
  → onExecuted callback → mainWindow.webContents.send('schedule:executed', payload)
  → Renderer: useLogs / useSchedules refresh via event listener
```

## State Management

No global state manager (no Redux, no Zustand, no Context). Each page has its own hook:
- `useSchedules` — full schedule list, CRUD actions
- `useLogs` — log list, clear action
- `useSettings` — settings object, update action

All hooks call IPC via `window.api` and trigger local `useState` refreshes. Shared state between pages is not needed (each tab is independent).

## Third-Party Service Integrations

| Service | Integration | Method |
|---|---|---|
| WhatsApp Desktop | URL scheme + AppleScript | `whatsapp://send?phone=&text=` + `osascript` |
| macOS Contacts | AppleScript query | `contacts.ipc.ts` + `osascript` |
| macOS Accessibility | System Settings link | `system:openAccessibilityPrefs` IPC |
| macOS Contacts Privacy | System Settings link | `contacts:openSettings` IPC |

No network calls. No external APIs. No cloud services.

## File Storage

- Database: `~/Library/Application Support/whatsapp-text-scheduler/schedules.db`
- App icon: `resources/icon.png` (bundled at build time)
- Build output: `out/` (not committed, gitignored)

## IPC Channel Naming Convention

All channels follow `domain:action` format:

```
schedule:getAll, schedule:get, schedule:create, schedule:update,
schedule:delete, schedule:toggle, schedule:testSend
logs:getAll, logs:bySchedule, logs:clear
settings:getAll, settings:update
system:checkAccessibility, system:openAccessibilityPrefs
contacts:search, contacts:checkAccess, contacts:openSettings
schedule:executed  (push event — main → renderer)
```

## Shared Types

`shared/types.ts` is imported by both `electron/` (Node.js) and `src/` (React). The composite `tsconfig.json` with two references (`tsconfig.node.json` + `tsconfig.web.json`) enforces this split. Path aliases `@shared/*` resolve in both contexts.

## Architecture Risks

1. **In-process cron**: If the Electron app crashes or is quit, all scheduled jobs are lost until next app launch. No background daemon or LaunchAgent.
2. **AppleScript fragility**: Any WhatsApp Desktop UI change can break the "press Enter" step. No visual confirmation that Enter was actually pressed in the correct input.
3. **Native module rebuild**: `better-sqlite3` must be rebuilt for the exact Electron version via `npm run rebuild`. If Electron version is bumped without rebuilding, the app will fail to start with a native module error.
4. **No retry**: Failed sends are logged but not retried. Manual re-trigger required.
5. **SQLite not encrypted**: Message content and phone numbers are stored in plaintext.
