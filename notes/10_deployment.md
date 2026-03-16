# 10 — Deployment

## Status

Confirmed from code — `package.json` (electron-builder config), `electron.vite.config.ts`.

This is a local macOS desktop app. There is no cloud deployment, no server, no CI/CD pipeline found in the repository.

## Deployment Target

| Layer | Target |
|---|---|
| Frontend + Backend | Packaged as a macOS `.app` via electron-builder |
| Database | Local SQLite file on user's machine |
| Scheduling | In-process node-schedule within the Electron main process |
| Automation | Local AppleScript via macOS `osascript` |

## Build Commands

```bash
# 1. Build all bundles
npm run build

# 2. Package as macOS app (produces dist/ with .dmg and .app)
npx electron-builder --mac
```

## electron-builder Config (`package.json`)

```json
{
  "build": {
    "appId": "com.veer.wa-scheduler",
    "productName": "WA Scheduler",
    "mac": {
      "icon": "resources/icon.png",
      "category": "public.app-category.productivity"
    }
  }
}
```

- No code signing config present (strongly inferred: not signed for distribution, runs with Gatekeeper warning on other machines).
- No `asar` exclusion config for `better-sqlite3` native binary — may need explicit exclusion for packaged builds to work correctly. **This is a potential packaging risk**.
- No auto-update config (no `electron-updater` dependency).

## Environment Separation

Not applicable. No staging/production environments. Single local user.

## Distribution

No public distribution channel (App Store, GitHub Releases, Homebrew) is set up. Personal use only.

To distribute to another machine:
1. Run `npx electron-builder --mac` on a Mac.
2. Copy the `.dmg` from `dist/` to the target machine.
3. Target machine must also have WhatsApp Desktop installed.
4. Target machine user must grant Accessibility and Contacts permissions to the app.

## Known Deployment Risks

1. **Native module packaging**: `better-sqlite3` must be correctly bundled for the target architecture (Apple Silicon vs Intel). `electron-builder` usually handles this, but the `postinstall` script (`electron-builder install-app-deps`) must run.

2. **No code signing**: Without a Developer ID certificate, macOS Gatekeeper will block the app on first launch. User must right-click → Open → confirm.

3. **Architecture mismatch**: Builds for Apple Silicon (arm64) won't run on Intel (x64) and vice versa unless a universal binary is configured. No universal build config is present.

4. **No auto-update**: Users must manually rebuild and replace the app for updates.

5. **asar packaging**: Native binaries (`.node` files) may need to be excluded from asar archive. Not explicitly configured — test packaged builds carefully.
