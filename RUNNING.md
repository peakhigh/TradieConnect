# Running TradieConnect Locally

## Backend (Firebase Emulators)

```bash
# One-time setup
cd functions && npm install && npm run build && cd ..

# Start emulators (from project root)
firebase emulators:start --only functions,firestore,storage
```

- Emulator UI → http://localhost:4000
- Functions → :5001 · Firestore → :8080 · Storage → :9199

## Frontend (Expo)

```bash
# One-time setup
npm install

# Web
npm run web

# Native (requires native build — not Expo Go, since we use @react-native-firebase)
npm run run:ios
npm run run:android
```

## Emulator Flags (`.env.local`)

Set all to `true` for a fully-local setup, or all `false` to hit production:

```
EXPO_PUBLIC_LOCAL_FUNCTIONS=true
EXPO_PUBLIC_LOCAL_FIRESTORE=true
EXPO_PUBLIC_LOCAL_STORAGE=true
```

> Auth always uses production (phone OTP). Don't enable `LOCAL_AUTH` unless the auth emulator is running.

## Seed Test Data

```bash
npm run seed
```
