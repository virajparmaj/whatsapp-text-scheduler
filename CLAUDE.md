# CLAUDE.md — WhatTime

---

## Project Overview
- **Name:** WhatTime
- **Description:** Local macOS desktop app that schedules WhatsApp messages via AppleScript automation
- **Status:** Active (v1.0 feature-complete)
- **Owner:** Veer

---

## Tech Stack
- **Language:** TypeScript 5.7 (strict)
- **Framework:** Electron 33 + electron-vite
- **Frontend:** React 18.3
- **UI Library:** shadcn/ui
- **Styling:** Tailwind CSS 3.4
- **Database:** SQLite via better-sqlite3 (local file at `~/Library/Application Support/WhatTime/schedules.db`)
- **Scheduling:** node-schedule (in-process cron)
- **Automation:** AppleScript via osascript (child_process)
- **Date/Time:** date-fns 4.1
- **Testing:** Vitest 4.1
- **Build:** electron-builder 26.8 (macOS DMG)
- **Package Manager:** npm

---

## Architecture

### Directory Structure
```text
electron/
├── ipc/
│   ├── contacts.ipc.ts    # macOS Contacts search via AppleScript
│   ├── handlers.ts         # IPC handler registration hub
│   ├── logs.ipc.ts         # Activity log retrieval & clearing
│   ├── schedule.ipc.ts     # Schedule CRUD, toggle, test send, conflict detection
│   └── settings.ipc.ts     # Settings management & system access checks
├── services/
│   ├── db.service.ts       # SQLite schema, migrations, CRUD operations
│   ├── scheduler.service.ts # Job scheduling, retry, missed-run catch-up
│   └── whatsapp.service.ts # AppleScript-based WhatsApp send (contacts + groups)
├── utils/
│   ├── applescript.ts      # AppleScript/shell execution wrapper
│   └── logger.ts           # Structured logging
├── main.ts                 # App lifecycle, window, tray, power monitor
└── preload.ts              # Context bridge (exposes window.api)
shared/
└── types.ts                # IPC contract + shared types (single source of truth)
src/
├── components/
│   ├── ErrorBoundary.tsx
│   ├── ExtendedScheduleDialog.tsx  # Quarterly/half-yearly/yearly config
│   ├── ScheduleForm.tsx            # Create/edit form with contact search
│   ├── ScheduleModal.tsx           # Dialog wrapper for form
│   ├── StatusBadge.tsx             # Status visualization
│   └── ui/                         # shadcn/ui primitives
├── contexts/
│   └── ScheduleContext.tsx  # Global schedule state + refresh
├── hooks/
│   ├── useLogs.ts           # Activity logs with real-time updates
│   └── useSettings.ts       # Settings fetch/update
├── lib/
│   ├── ipc.ts               # IPC API client (wraps window.api)
│   └── utils.ts             # cn(), formatDate, timeline bucketing
├── pages/
│   ├── Calendar.tsx          # Month view with schedule indicators
│   ├── Dashboard.tsx         # Schedule list with filter/sort/group
│   ├── Logs.tsx              # Activity log viewer with status filter
│   └── Settings.tsx          # Permissions, dry-run, delays, theme
├── App.tsx                   # Theme manager, tab nav, keyboard shortcuts
└── main.tsx                  # React entry point
tests/
├── ipc-contracts.test.ts
├── ipc-validation.test.ts
├── scheduler.logic.test.ts
└── types.test.ts
notes/                        # 17 design docs (architecture, UX, known issues, roadmap)
```

### Key Entry Points
- **Electron main:** `electron/main.ts`
- **Preload bridge:** `electron/preload.ts` (exposes `window.api` — ElectronAPI interface)
- **React entry:** `src/main.tsx` → `src/App.tsx`
- **IPC registration:** `electron/ipc/handlers.ts`
- **Shared types:** `shared/types.ts`

### Data Flow
React renderer → IPC via `window.api` → Electron main process → SQLite (better-sqlite3) + node-schedule jobs. WhatsApp sends via AppleScript keystroke injection through osascript. Real-time updates pushed back to renderer via `schedule:executed` IPC event.

### Database Schema (3 tables)
- **schedules** — phone_number, contact_name, group_name, message, schedule_type, time/day/month fields, enabled, dry_run
- **run_logs** — schedule_id FK, status (success/failed/dry_run/skipped), error_message, execution_duration, retry metadata
- **settings** — key/value pairs (global_dry_run, send_delay_ms, max_retries, theme, etc.)

Schema defined inline in `db.service.ts` via `CREATE TABLE IF NOT EXISTS`. No separate migration files. Column additions use try/catch ALTER TABLE patterns.

---

## Development Setup

### Prerequisites
- Node.js 18+
- macOS (Apple Silicon or Intel) — required for AppleScript automation
- Accessibility permission granted in System Settings (for keystroke injection)
- Contacts permission (optional, for contact search)

### Install & Run
```bash
npm install
npm run rebuild    # Rebuild better-sqlite3 native module for Electron
npm run dev        # Start Electron app with hot reload
```

### No Environment Variables Required
Fully local app — no secrets, no API keys, no `.env` files.

---

## Coding Standards

### Naming Conventions
- Files: kebab-case for utilities, PascalCase for React components
- Components: PascalCase
- Functions/variables: camelCase
- Types/interfaces: PascalCase (no `I` prefix) — defined in `shared/types.ts`
- Database columns: snake_case

### File Organization
- Components in `src/components/` — one component per file
- Pages in `src/pages/` — tab-based navigation (not route-based)
- Shared types in `shared/types.ts` (single file, shared between main and renderer)
- Hooks in `src/hooks/`
- IPC handlers in `electron/ipc/` — one file per domain (schedule, logs, settings, contacts)
- Backend services in `electron/services/`

### Reusable Utilities (use these, don't reinvent)
- `src/lib/utils.ts` — `cn()` helper, `formatDate`, `getTimelineBucket`
- `src/lib/ipc.ts` — typed IPC client wrapping `window.api`
- `src/contexts/ScheduleContext.tsx` — schedule state + CRUD methods
- `src/hooks/useSettings.ts` — settings state + update
- `src/hooks/useLogs.ts` — logs with real-time refresh on execution
- `electron/utils/applescript.ts` — safe AppleScript execution
- `electron/utils/logger.ts` — structured logging

### State Management
- **Frontend:** Context API (`ScheduleContext`) — no Redux/Zustand
- **Server state:** IPC calls to SQLite via `window.api`, push updates via `schedule:executed` event
- **Scheduler state:** In-memory `Map<string, Job>` + mutex `Set<string>` in `scheduler.service.ts`
- **Avoid:** Don't put API (IPC) calls directly in components — use context methods or hooks

### IPC Patterns
All IPC uses `ipcMain.handle()` / `ipcRenderer.invoke()` (Promise-based). Channels follow `domain:action` naming:
- `schedule:getAll`, `schedule:create`, `schedule:update`, `schedule:delete`, `schedule:toggle`, `schedule:testSend`
- `logs:getAll`, `logs:bySchedule`, `logs:clear`
- `settings:getAll`, `settings:update`
- `contacts:search`, `contacts:checkAccess`
- `system:checkAccessibility`, `system:openAccessibilityPrefs`

When adding new IPC channels: update `shared/types.ts` (ElectronAPI interface), `electron/preload.ts` (context bridge), and the relevant `electron/ipc/*.ts` handler file.

---

## Testing

### Framework & Tools
- Vitest 4.1 with globals enabled
- Test files in `tests/` directory

### Running Tests
```bash
npm run test         # Run once
npm run test:watch   # Watch mode
```

### Conventions
- Test files: `tests/[name].test.ts`
- Suites cover: IPC contracts, input validation, scheduler logic, type mappings
- No E2E tests yet — manual testing via the app

---

## Build & Distribution

### Commands
```bash
npm run build       # Compile to out/ (no packaging)
npm run dist        # Build + create macOS .app bundle
npm run dist:dmg    # Build + create DMG installer
```

### Output
- Dev build: `out/main/` + `out/renderer/`
- Distribution: `dist/` folder (DMG for macOS arm64)
- `better-sqlite3` is asarUnpack'd in electron-builder config

---

## Key Architectural Decisions

1. **No cloud backend** — all data local in SQLite, no sync, no accounts
2. **AppleScript automation** — sends messages by simulating UI keystrokes (fragile but no unofficial API needed)
3. **App must be running** — scheduler is in-process; no system daemon
4. **Missed-run catch-up** — on startup, detects and fires schedules that were missed while app was closed
5. **Mutex + retry** — prevents double-sends, retries transient failures with exponential backoff (10s, 30s, 90s)
6. **Non-retryable errors** — accessibility permission denied, screen locked, screen saver active → fail immediately
7. **Group messaging** — feature-flagged (`enable_group_scheduling`), less reliable than contacts (uses search + clipboard)
8. **Dry-run mode** — global and per-schedule; opens chat but skips the Enter keystroke

---

## macOS Permissions (Critical)
- **Accessibility** — Required for AppleScript keystroke injection. Without it, messages open in WhatsApp but never send. Check via `system:checkAccessibility` IPC.
- **Contacts** — Optional. Enables contact name search in schedule form. Gracefully degrades to manual phone entry if denied.

---

## Known Issues & Tech Debt
- AppleScript automation is inherently fragile — depends on WhatsApp UI not changing
- Screen must be unlocked for sends to work (detected and skipped if locked)
- Group message sending less reliable than contact deep links
- No E2E test coverage
- See `notes/11_known_issues.md` for full list

---

## Debugging Tips
- **Messages not sending** → Check Accessibility permission in System Settings > Privacy & Security
- **Contact search not working** → Check Contacts permission in System Settings > Privacy & Security
- **Schedule didn't fire** → App must be running; check Logs tab for skipped/failed entries
- **better-sqlite3 errors after update** → Run `npm run rebuild` to recompile native module
- **Type errors** → `shared/types.ts` is the single source of truth for IPC contracts
- **Build issues** → Check `electron.vite.config.ts` for build config

---

## Documentation
Detailed design docs live in `notes/` (17 files covering architecture, UX, schema, known issues, roadmap). Read these before major changes:
- `notes/00_overview.md` — project status and feature gaps
- `notes/03_architecture.md` — system architecture
- `notes/05_database_schema.md` — DB schema details
- `notes/11_known_issues.md` — tracked bugs and tech debt
- `notes/12_roadmap.md` — planned features

---

## Learned Patterns
<!-- After corrections, add patterns here so they don't repeat -->
