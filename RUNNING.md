# Running TradieConnect Locally

## Backend (Firebase Emulators)

```bash
# One-time setup
cd functions && npm install && npm run build && cd ..

# Start emulators (from project root)
npm run emulators
# (equivalent to: firebase emulators:start --only functions,firestore,storage)
```

TradieConnect uses **offset ports** so it can run at the same time as the
BuildOn and Educator projects (see "Running all 3 apps together" below).

- Emulator UI → http://localhost:4040
- Functions → :5101 · Firestore → :8180 · Storage → :9290 · Auth → :9190

## Frontend (Expo)

```bash
# One-time setup
npm install

# Web (Metro on port 8082)
npm run web

# Native (requires native build — not Expo Go, since we use @react-native-firebase)
npm run run:ios
npm run run:android
```

## Emulator Flags (`.env.local`)

Set the `LOCAL_*` flags to `true` for a fully-local setup, or all `false` to
hit production:

```
EXPO_PUBLIC_LOCAL_FUNCTIONS=true
EXPO_PUBLIC_LOCAL_FIRESTORE=true
EXPO_PUBLIC_LOCAL_STORAGE=true
```

The emulator **ports** are also set in `.env.local` and must match
`firebase.json`:

```
EXPO_PUBLIC_EMULATOR_FUNCTIONS_PORT=5101
EXPO_PUBLIC_EMULATOR_FIRESTORE_PORT=8180
EXPO_PUBLIC_EMULATOR_AUTH_PORT=9190
EXPO_PUBLIC_EMULATOR_STORAGE_PORT=9290
```

> Auth always uses production (phone OTP). Don't enable `LOCAL_AUTH` unless the
> auth emulator is running.

## Feature Flags (`.env.local`)

These match the BuildOn project's flag names so behaviour is consistent across
the marketplace apps. Local/dev only — keep them `false` in production.

| Flag | Effect |
|------|--------|
| `EXPO_PUBLIC_LOCAL_USE_MOCKS` | Use placeholder/mock data instead of real Firebase uploads & calls |
| `EXPO_PUBLIC_AUTOFILL` | Pre-fill forms (signup, post request, quote, onboarding) with test data |
| `EXPO_PUBLIC_SKIP_CAPTCHA` | Skip the phone-OTP reCAPTCHA verifier (for emulator/testing) |
| `EXPO_PUBLIC_SKIP_TOASTS` | Suppress toast/alert popups (useful for automated tests) |
| `EXPO_PUBLIC_ENABLE_DELETE_DATA` | Enable destructive "delete my data" actions in non-prod builds |

```
EXPO_PUBLIC_LOCAL_USE_MOCKS=false
EXPO_PUBLIC_AUTOFILL=true
EXPO_PUBLIC_SKIP_CAPTCHA=false
EXPO_PUBLIC_SKIP_TOASTS=false
EXPO_PUBLIC_ENABLE_DELETE_DATA=false
```

> `EXPO_PUBLIC_USE_MOCKS` (the older tradie-app name) is still honoured as a
> fallback for `EXPO_PUBLIC_LOCAL_USE_MOCKS`.

All flags are read in `app/utils/featureFlags.ts` and logged at startup (dev
only) from `App.tsx`.

## Seed Test Data

```bash
npm run seed
```

---

## Running all 4 apps together (BuildOn + TradieConnect + Educator + TripsNTrucks)

All four projects historically shared the **same** emulator and Metro ports,
so only one could run at a time. To run them simultaneously, each project gets
its own port block. **BuildOn keeps the defaults**; TradieConnect, Educator,
and TripsNTrucks are offset.

| Project        | Emulator UI | functions | firestore | auth | storage | Metro |
|----------------|-------------|-----------|-----------|------|---------|-------|
| BuildOn        | 4000        | 5001      | 8080      | 9099 | 9199    | 8081  |
| TradieConnect  | 4040        | 5101      | 8180      | 9190 | 9290    | 8082  |
| Educator       | 4080        | 5201      | 8280      | 9390 | 9490    | 8083  |
| TripsNTrucks   | 4120        | 5301      | 8380      | 9590 | 9690    | 8084  |

### Start order (8 terminals, or 4 if you only need web)

```bash
# --- BuildOn (defaults) ---
cd ~/Documents/Projects/buildon            && npm run emulators       # terminal 1
cd ~/Documents/Projects/buildon/frontend   && npm run web             # terminal 2

# --- TradieConnect (offset) ---
cd ~/Documents/Projects/tradie-app         && npm run emulators       # terminal 3
cd ~/Documents/Projects/tradie-app         && npm run web             # terminal 4

# --- Educator (offset) ---
cd ~/Documents/Projects/educator           && npm run emulators       # terminal 5
cd ~/Documents/Projects/educator           && npm run web             # terminal 6

# --- TripsNTrucks (offset) ---
cd ~/Documents/Projects/tripsNtrucks       && npm run emulators       # terminal 7
cd ~/Documents/Projects/tripsNtrucks       && npm run web             # terminal 8
```

Each app's web bundler prints its own URL (8081 / 8082 / 8083 / 8084). Open all
four in separate browser tabs.

### Native emulators / simulators

A single iOS Simulator (or Android emulator) can run all four app builds at
once — they're separate bundle IDs. Just run `npm run run:ios` / `npm run
run:android` in each project. Each connects to its own Metro port and its own
Firebase emulator ports automatically (the ports are read from each project's
`.env`).

> Android note: the emulator reaches your host via `10.0.2.2`, which the
> Firebase client config already handles. The offset ports apply there too.

### One-time setup status

All four projects are now configured to run side by side:

- **BuildOn** — unchanged (keeps the default ports).
- **TradieConnect** — emulator ports offset (4040/5101/8180/9190/9290), Metro on 8082.
- **Educator** — emulator ports offset (4080/5201/8280/9390/9490), Metro on 8083.
  Edited via the `_educator` symlink in this workspace.
- **TripsNTrucks** — emulator ports offset (4120/5301/8380/9590/9690), Metro on 8084.
  Edited via the `_tripsNtrucks` symlink in this workspace.

Each app's client emulator ports are env-driven (in its `.env.local`) and match
its `firebase.json`, the same pattern across all projects.
