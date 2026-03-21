# 09 — Dev Setup

## Purpose
Provide a reliable local setup guide tied to the current repo.

## Status
- **Confirmed from code**: scripts, dependencies, build config, and runtime prerequisites.
- **Not found in repository**: `.env.example`, cloud service link files, remote backend setup.

## Confirmed from code

### Runtime prerequisites
- macOS required (AppleScript + System Events + Contacts integration).
- Node.js (project uses Electron 33; Node 18+ recommended).
- WhatsApp Desktop installed and logged in.
- Accessibility permission needed for live sends.
- Contacts permission optional but required for contact search.

### Install and run
```bash
npm install
npm run rebuild
npm run dev
```

### Build/package
```bash
npm run build
npx electron-builder --mac
```

### Key scripts (`package.json`)
- `dev`: `electron-vite dev`
- `build`: `electron-vite build`
- `preview`: `electron-vite preview`
- `postinstall`: `electron-builder install-app-deps`
- `rebuild`: `electron-rebuild -f -w better-sqlite3`

### Environment variables
- **Confirmed from code**: no app-required `.env` variables are referenced for core functionality.
- Runtime configuration is persisted in SQLite settings table.

### Paths and aliases
- Renderer alias `@ -> src`.
- Shared alias `@shared -> shared` for node/renderer.

## Inferred / proposed
- **Strongly inferred** most local setup failures are native module mismatch or missing macOS permissions.

## Important details
- `better-sqlite3` is native; rebuild step is required after dependency/Electron changes.
- DB path resolves under Electron `userData`, not project root.
- Development uses one app window and no web server deployment.

## Open issues / gaps
- No automated environment validation script (permissions/WhatsApp presence checks).
- No test runner configuration in repo for fast regression checks.

## Recommended next steps
1. Add a preflight check command for permissions and WhatsApp availability.
2. Add basic test/lint scripts for CI and local confidence.
3. Keep setup notes synced with `package.json` script changes.
