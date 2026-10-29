# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm start          # Start dev server (copies .env.local → .env, port 8086)
npm run ios        # Open in iOS simulator
npm run android    # Open in Android emulator
npm run web        # Open in browser
npm run emulators      # Build + start the Functions emulator only
npm run emulators-all  # Build + start Functions, Firestore and Storage emulators
```

`start:prod` / `ios:prod` / `android:prod` / `web:prod` run Expo without copying `.env.local`, so whatever is in `.env` is used.

### Seed data (mock DATA only — see no-mock rule)
```bash
npm run seed           # bin/data/seed.js
npm run seed:reporting # bin/data/backfillReporting.js
npm run clean          # bin/data/clean.js
npm run seed:reset     # clean + seed + backfill reporting
```

### E2E / regression
```bash
npm run e2e:emulators          # Auth, Functions, Firestore, Storage emulators
npm run e2e:seed               # Seed the emulator using .env.e2e
npm run e2e:verify-isolation   # Check .env.e2e points only at emulators
npm run e2e:data               # Data-layer tests (tsx --test e2e/data/*.test.ts)
npm run e2e:web                # Playwright (e2e/web/*.spec.ts)
npm run e2e:mobile             # Maestro (.maestro/)
```
CI (`.github/workflows/e2e.yml`) runs `e2e/ci/run-suite.sh` inside `firebase emulators:exec`: clean + seed → data tests → web build served on :8086 → Playwright. Stable test IDs live in `e2e/support/testids.ts`.

### Deploy (never without explicit user approval)
```bash
npm run deploy:functions   # Cloud Functions only
npm run deploy:hosting     # Build + deploy web hosting only
npm run deploy:indexes     # Firestore indexes
npm run deploy:rules       # Firestore + Storage security rules
npm run deploy             # Build web + hosting + functions
npm run deploy:all         # Build web + everything
```

## Architecture Overview

### App Shell
- `App.tsx` → `<AppErrorBoundary>` → `<AlertProvider>` → `<AuthProvider>` → `<UserProvider>` → `<NotificationsProvider>` → `<AppNavigator>`
- `AppNavigator` routes by `user.userType` (`customer` / `tradie` / `admin`); tradies are gated on `onboardingCompleted`. See `.kiro/steering/navigation.md`.
- Auth state lives in `app/context/AuthContext.tsx`; use `useAuth()` everywhere.
- Alerts/confirmations: `showAlert` / `useAlert` from `app/components/UI/AlertProvider.tsx` (cross-platform replacement for `Alert.alert`).

### Firebase
- Project `tradie-mate-f852a`; web app at https://tradie-mate-f852a.web.app
- Web SDK (`@firebase/…`) for the web bundle, `@react-native-firebase/…` for native builds.
- Cloud Functions in `functions/src/` (TypeScript, Node 22, default region us-central1), modules: `admin`, `auth`, `chat`, `notifications`, `payments`, `reporting`, `requests`. Money and private-data operations go through callable functions only.
- Emulator ports (`firebase.json`): Auth 9790, Functions 5401, Firestore 8480, Storage 9890, UI 4160, Hub 4440. They are offset so sibling projects can run emulators concurrently.

### Environment
- `.env.local` → development; `.env.e2e` → all emulators (E2E); both gitignored.
- Scripts copy the right file to `.env`. All client env vars must be prefixed `EXPO_PUBLIC_`.
- Dev feature flags (`useMocks`, `autofill`, `skipCaptcha`, `skipToasts`, `enableDeleteData`) are in `app/utils/featureFlags.ts`.

### Path Alias
`@/*` resolves to the repo root (`./*`), e.g. `@/app/services/firebase`.

## Conventions

Project conventions are the single source of truth in `.kiro/steering/` and apply identically regardless of which tool/agent is editing:

- `.kiro/steering/project-overview.md` — product, business model, roles, key flows
- `.kiro/steering/tech-stack.md` — stack and project structure
- `.kiro/steering/architecture-decisions.md` — precomputed `requestIntelligence`, batch scrolling, Cloud Functions for sensitive ops, config-driven design, phone OTP
- `.kiro/steering/coding-standards.md` — TypeScript, components, naming, Firebase patterns, error handling
- `.kiro/steering/data-model.md` — Firestore collections and indexes
- `.kiro/steering/cloud-functions.md` — callable functions, error codes, structure
- `.kiro/steering/navigation.md` — navigation flow and adding screens
- `.kiro/steering/ui-components.md` — available components and rules for new ones
- `.kiro/steering/ui-interaction-rules.md` — drawers right→left, dropdowns beneath trigger, Gluestack + Styled Components only
- `.kiro/steering/modal-pattern.md` — RN `Modal` confirmations; never `Alert.alert` / `window.confirm`
- `.kiro/steering/no-mock-rule.md` — no fake/stub app code; mock data only via seed scripts
- `.kiro/steering/common-tasks.md` — recipes for screens, components, functions, collections
- `.kiro/steering/cross-project.md` — sibling reuse (`_buildon` first, then `_educator`, `_tripsNtrucks`)

Read these before making UI or structural changes. If a convention needs to change, edit it in `.kiro/steering/`, not here.

## Hard rules

- **Every change works on iOS, Android and Web** from the single codebase.
- **No commit or push without explicit user approval** (mirrors `.kiro/hooks/git-push-guard.kiro.hook`).
- **No deploy without explicit user approval** — functions, hosting, rules and indexes all touch production.
- **Secrets never go in a git-tracked file** (passwords, PINs, API keys, tokens, webhook secrets — test accounts included; code, docs, steering, comments, commit messages). Cloud Functions runtime secrets belong in Firebase Secret Manager (`defineSecret`). A secret that was ever committed counts as leaked: rotate it.
- **Seed/cleanup scripts never touch real users.** Prefer the emulator (`.env.e2e`); anything run against the real project must target explicit, known IDs and be dry-run by default.

## Working inside Orca

This repo is often worked on from inside **Orca** (onorca.dev), which runs several AI agent sessions side by side. Assume other sessions may be working in this repo concurrently: check for already-running dev servers/emulators before starting your own, and don't kill a process you didn't start. Run `orca agent-context` for the command reference; `orca tab` / `snapshot` / `click` / `fill` / `screenshot` / `console` / `network` drive the app in the browser end to end.

If you start a long-running process yourself, stop it the way you started it (Ctrl-C) rather than a background `kill`, so cleanup traps fire.

## Documentation

Project docs live in `docs/`; `README.md` and `RUNNING.md` cover setup. Check them for existing decisions before implementing features.
