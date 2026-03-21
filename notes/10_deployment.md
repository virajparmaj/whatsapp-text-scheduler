# 10 — Deployment

## Purpose
Document how this project is built and distributed based on current repository evidence.

## Status
- **Confirmed from code**: macOS desktop packaging workflow via electron-builder.
- **Not found in repository**: Vercel/Netlify/Render/Supabase deployment configs, backend hosting, CI release pipeline.

## Confirmed from code

### Deployment target
- Single packaged Electron app for macOS (`.app`/`.dmg` style packaging via electron-builder).
- Local SQLite database stored on each user's machine.
- No separate frontend/backend deployment units.

### Build and package commands
```bash
npm run build
npx electron-builder --mac
```

### Packaging config clues (`package.json`)
- `appId`: `com.veer.wa-scheduler`
- `productName`: `WA Scheduler`
- macOS icon/category configured.

### Environment separation
- No staging/prod env split implemented.
- No remote secrets/environment management layer in repo.

### Deployment dependencies
- Native module compatibility (`better-sqlite3`) with Electron version/arch.
- Target machine must satisfy runtime requirements:
  - WhatsApp Desktop installed/logged in
  - Accessibility permission granted
  - Unlocked macOS session at send time

## Inferred / proposed
- **Strongly inferred** distribution is currently personal/internal, not formal public release.
- **Strongly inferred** code signing/notarization is not configured in repository.

## Important details
- App behavior depends on local automation capabilities, so “deployment success” requires post-install permission checks.
- Scheduler only runs while app process is active.

## Open issues / gaps
- Potential packaging risk from native module handling and asar settings.
- No automated release validation/smoke test workflow.
- No auto-update channel configured.

## Recommended next steps
1. Add documented post-package smoke test checklist (launch, schedule, send, log, permissions).
2. Validate native module packaging on both arm64 and x64 targets.
3. Add signing/notarization plan if wider distribution is planned.

## Recommended release order (if packaging changes are made)
1. Rebuild native deps (`npm run rebuild`).
2. Build bundles (`npm run build`).
3. Package app (`electron-builder --mac`).
4. Run local install smoke tests on clean profile.
