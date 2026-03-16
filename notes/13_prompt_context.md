# 13 — Prompt Context (AI Agent Reference)

## What the App Is

**WA Scheduler** is a local macOS Electron desktop application that lets a single user schedule WhatsApp messages. It opens WhatsApp Desktop via the `whatsapp://` URL scheme and presses Enter using AppleScript. All data is stored locally in SQLite. No cloud backend, no accounts, no network calls.

## Product Goals

- Schedule messages (one-time, daily, weekly, quarterly, half-yearly, yearly) to individual WhatsApp contacts.
- Run entirely locally with no privacy risk — data never leaves the machine.
- Be simple enough for a single non-technical user to operate.

## Stack

| Layer | Technology |
|---|---|
| Desktop framework | Electron 33 |
| Renderer | React 18 + TypeScript 5.7 + Vite 5 |
| Styling | Tailwind CSS 3.4 + shadcn/ui (badge, button, dialog, input, label, select, switch, textarea) |
| Icons | lucide-react |
| Database | SQLite via better-sqlite3 |
| Scheduling | node-schedule (in-process cron in Electron main) |
| Automation | AppleScript via child_process (`osascript`) |
| Build/package | electron-vite + electron-builder |
| Shared types | `shared/types.ts` (imported by both main and renderer) |

## Architecture Constraints

- **Two processes**: Electron main (Node.js) and renderer (React). They communicate only via IPC.
- **IPC channel naming**: `domain:action` (e.g., `schedule:create`, `logs:getAll`).
- **Preload bridge**: All `window.api` methods are exposed via `contextBridge` in `electron/preload.ts`. Never call `ipcRenderer` directly from renderer.
- **Shared types**: Always import types from `shared/types.ts` — never redefine in renderer or main.
- **SQLite is synchronous**: `better-sqlite3` uses synchronous API. Do not add async wrappers. Run DB operations directly in IPC handlers.
- **No external APIs**: Do not add HTTP clients, fetch calls, or cloud services without explicit approval.
- **macOS only**: Do not add cross-platform abstractions. AppleScript is intentional.

## Design Rules

- Use shadcn/ui primitives for all UI components — do not hand-roll buttons, inputs, dialogs.
- Tailwind utility classes only — no CSS modules, no styled-components.
- Green (`--primary`, HSL 142 71% 45%) is the brand accent. Do not change it.
- Sidebar is `w-52` fixed. Do not make it resizable or collapsible without explicit request.
- Body has `padding-top: 2.5rem` for macOS traffic lights — do not remove.
- Tab-based navigation (no React Router). `activeTab` state lives in `App.tsx`.

## Things to Preserve

- `shared/types.ts` is the single source of truth for all TypeScript interfaces. Keep it in sync whenever you add fields to the DB schema or IPC handlers.
- `electron/db/schema.sql` is the canonical schema. `db.service.ts` runs it on startup. Add new columns via `ALTER TABLE` migration blocks in `initDb()`, not by modifying the existing `CREATE TABLE` statements.
- The `rowToSchedule()` and `rowToRunLog()` functions in `db.service.ts` map DB columns to TS types — update them whenever you add schema fields.
- `electron/preload.ts` exposes all IPC methods. Whenever you add a new IPC channel, add it to the preload bridge and to the `ElectronAPI` interface in `shared/types.ts`.
- nanoid v3 is used (`nanoid@3.3.11`) — import as `const { nanoid } = require('nanoid')` in CommonJS context, or `import { nanoid } from 'nanoid'` in ESM. Check the existing import style in `db.service.ts`.

## Known Weak Points

1. IPC handlers have no try/catch — exceptions surface as generic Electron errors.
2. The packaged `.app` may fail if `better-sqlite3` is bundled inside the asar archive — add `asarUnpack` config.
3. All schedules are lost if the app is not running at fire time.
4. AppleScript automation breaks if WhatsApp changes its UI layout.
5. Contact search returns `[]` silently on permission denial — no user-facing explanation.
6. Dark mode is configured in Tailwind but has no CSS variable overrides — effectively disabled.

## Editing Rules for Future Coding Agents

1. **Read `shared/types.ts` before touching any data model.** All types flow from there.
2. **Read `electron/db/schema.sql` before any DB change.** Schema drives everything downstream.
3. **After adding a DB field**: update schema.sql → add ALTER TABLE migration in initDb() → update rowToSchedule/rowToRunLog → update shared/types.ts → update IPC handler → update preload.ts → update renderer hook.
4. **After adding an IPC channel**: add handler in appropriate `electron/ipc/*.ipc.ts` → register in `electron/ipc/handlers.ts` → expose in `electron/preload.ts` → add to `ElectronAPI` in `shared/types.ts` → add client call in `src/lib/ipc.ts`.
5. **Do not add npm packages that require rebuilding** (native addons) without noting that `npm run rebuild` will need to be re-run.
6. **Run `npm run build`** after any significant change to catch TypeScript errors and bundle issues.
7. **Do not use React Router** — navigation is tab-based via `activeTab` in `App.tsx`.
8. **Do not add cloud dependencies** — this app is intentionally fully local.
9. **Test sends are the primary debug tool** — the Play button in Dashboard runs the full execution path.
10. **AppleScript strings must sanitise user input** — any user-controlled string embedded in an AppleScript must strip or escape quotes and backslashes.
