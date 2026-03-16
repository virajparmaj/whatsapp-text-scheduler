# 09 — Dev Setup

## Status

Confirmed from code — `package.json`, `electron.vite.config.ts`, `tsconfig*.json`.

## Prerequisites

- **macOS** (required — app uses AppleScript + macOS Contacts; will not work on other platforms)
- **Node.js** 18+ (Electron 33 requires Node 18)
- **npm** (lockfile is `package-lock.json` — use npm, not pnpm or yarn)
- **WhatsApp Desktop** installed and logged in
- **macOS Accessibility permission** granted to the app (prompt appears on first run, or grant manually in System Settings → Privacy & Security → Accessibility)

## Install

```bash
cd whatsapp-text-scheduler
npm install
npm run rebuild   # REQUIRED — rebuilds better-sqlite3 native module for Electron
```

`npm run rebuild` runs `electron-rebuild -f -w better-sqlite3`. This step is mandatory after any `npm install` or Electron version change. Without it, the app will crash at startup with a native module error.

## Run in Development

```bash
npm run dev
```

Starts `electron-vite dev`:
- Renderer (React) hot-reloads via Vite HMR.
- Main process (Electron) restarts on change.
- DevTools are available (Electron default in dev mode).

## Build

```bash
npm run build
```

Outputs to `out/`:
- `out/main/index.js` — main process bundle
- `out/preload/index.js` — preload bundle
- `out/renderer/` — React app assets

## Package (macOS .app)

```bash
npm run build && npx electron-builder --mac
```

Produces `.dmg` / `.app` in `dist/`. App ID: `com.veer.wa-scheduler`.

## Environment Variables

**No `.env` file required.** This is a local desktop app — all configuration is stored in SQLite (`settings` table). There are no secrets, API keys, or environment variables in the codebase.

## Path Aliases

| Alias | Resolves to | Context |
|---|---|---|
| `@/*` | `src/*` | Renderer (React) |
| `@shared/*` | `shared/*` | Both renderer and main |

Configured in `tsconfig.web.json`, `tsconfig.node.json`, and `electron.vite.config.ts`.

## TypeScript

Three tsconfig files:
- `tsconfig.json` — composite root, references the two below
- `tsconfig.node.json` — Electron main + preload (target: ESNext, module: ESNext)
- `tsconfig.web.json` — React renderer (target: ESNext, jsx: react-jsx)

Strict mode is enabled in both.

## Native Module Rebuild Gotcha

`better-sqlite3` is a native addon. Whenever you:
- Run `npm install` fresh
- Update Electron version in `package.json`
- Switch Node.js versions

You **must** re-run `npm run rebuild` afterwards. Forgetting this is the most common setup failure.

## Common Setup Problems

| Problem | Cause | Fix |
|---|---|---|
| App crashes at startup with "module not found" or native error | better-sqlite3 not rebuilt | `npm run rebuild` |
| Contacts search returns empty results | Contacts privacy permission not granted | System Settings → Privacy → Contacts → enable app |
| Test send opens WhatsApp but message not sent | Accessibility permission not granted | System Settings → Privacy → Accessibility → enable app |
| Test send opens WhatsApp but Enter pressed too early | `sendDelayMs` too low | Increase in Settings (try 5000+ ms on slow machines) |
| `electron-vite` not found | Dependencies not installed | `npm install` |

## SQLite Database Location

During development and production, the database is at:

```
~/Library/Application Support/whatsapp-text-scheduler/schedules.db
```

To reset the database during development:

```bash
rm ~/Library/Application\ Support/whatsapp-text-scheduler/schedules.db
```

The app recreates it on next launch.
