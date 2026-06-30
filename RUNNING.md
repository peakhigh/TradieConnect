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

Generate a full, realistic dataset against the **running emulator** (or a dev
project) so every feature can be exercised. Per the no-mock rule, this is mock
**data** only — all app behaviour runs against the real backend.

```bash
# Start the emulator first (separate terminal):
npm run emulators

# Then seed everything (users, requests, quotes, chat, notifications, reporting):
npm run seed:all          # = seed.js + backfillReporting.js
npm run seed:reset        # clean + seed + backfill (fresh start)
npm run seed:reporting    # rebuild only the reporting rollups
npm run clean             # remove ONLY seed data (docs tagged mock:true)
```

### What gets created

| Data | Covers / lets you test |
|------|------------------------|
| **5 users** — customer, tradie, admin, 2 pending tradies | role routing, admin approvals |
| **100 service requests** (90-day spread, flat `intel_*`) | Explorer, intelligence, reporting trends |
| **30 quotes** (10 unlocked / 15 quoted / 5 accepted) | unlock, submit-quote, accept/decline, dashboards |
| **6 completed + rated jobs** (+ `ratings` docs, tradie rating/totalJobs) | customer History (completed), tradie "Completed Jobs" tab, ratings |
| **3 cancelled requests** | customer History (cancelled) |
| **Wallet transactions** (bonus / recharge / unlock) | Wallet screen + history |
| **5 chat rooms** with text / quote / system / **image** / **document** messages | chat window, thumbnails, file open, quote card, filters |
| **7 notifications** (read/unread, all types) | notifications feed, unread badges |
| **Reporting rollups + suburb adjacency** | Insights, rankings, suburb detail, nearby suburbs |

### Test accounts (fixed UIDs)

The seed writes user docs with fixed IDs. To sign in as one, create a Firebase
Auth user (phone OTP) and map it to the matching UID, or use the Auth emulator:

| Role | UID | Phone |
|------|-----|-------|
| Customer | `L4uj8MTCfhWhoMpWWwj8y6LzcZs2` | `0405724199` |
| Tradie | `tradie_test_001` | `0405726599` |
| Admin | `admin_test_001` | `0400000000` |

> Cleanup is safe: `npm run clean` only deletes docs tagged `mock:true` and
> refuses to run against a non-allowlisted project unless `--force` is passed
> (see `bin/data/config.js`). It never touches real user data.


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

> **Emulator hub + logging ports must also be offset**, or a second suite's
> Firestore silently fails to start (symptom: client `FirebaseError code
> "unavailable"` + `WebChannel 'Listen' transport errored`). These default to
> 4400/4500 for every project, so they collide when running more than one suite.
>
> | Project | hub | logging |
> |---------|-----|---------|
> | BuildOn | 4400 | 4500 (defaults) |
> | TradieConnect | 4410 | 4510 |
> | Educator | 4420 | 4520 |
> | TripsNTrucks | 4430 | 4530 |

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


---

## Payments (Stripe)

Wallet recharge has two modes, controlled by env flags. **Off by default** — no
real charge happens and the wallet is credited directly so you can exercise the
unlock/quote flows against seeded data.

| Mode | Client `EXPO_PUBLIC_PAYMENTS_LIVE` | Server `PAYMENTS_LIVE` | Behaviour |
|------|-----------------------------------|------------------------|-----------|
| Dev (default) | `false` | `false` | `rechargeWallet` credits directly (labelled "dev credit"). No card capture. |
| Live | `true` | `true` | Real Stripe charge required before any credit. Web → hosted Checkout; native → PaymentSheet. |

> Both flags must agree. If the client is live but the server isn't, the server
> refuses (it never credits without a verified charge), and vice-versa.

### Flow by platform (live mode)

- **Web** → `createCheckoutSession` → redirect to Stripe-hosted Checkout → on
  return, `confirmCheckoutRecharge` verifies the session and credits.
- **Native** → `createPaymentIntent` → Stripe **PaymentSheet** → `rechargeWallet`
  verifies the PaymentIntent (status/amount/currency/owner) and credits.
- **Webhook** (`stripeWebhook`) is a server-side backstop that credits directly
  from Stripe events even if the user closes the tab / kills the app.

All three converge on `creditWallet`, which is **idempotent on the PaymentIntent
id** — a payment is never credited twice.

### Enabling live payments

1. **Create a Stripe account** and grab your keys (Dashboard → Developers → API keys):
   - Secret key `sk_test_...` / `sk_live_...`
   - Publishable key `pk_test_...` / `pk_live_...`

2. **Client env** (`.env.local`):
   ```
   EXPO_PUBLIC_PAYMENTS_LIVE=true
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```

3. **Server env** — copy `functions/.env.example` to `functions/.env` (and/or
   `functions/.env.<projectId>`) and set:
   ```
   PAYMENTS_LIVE=true
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx   # see "Activating the webhook" below
   ```

4. **Native only** — install the Stripe SDK (loaded lazily; the build stays
   green without it, but PaymentSheet needs it at runtime):
   ```bash
   npx expo install @stripe/stripe-react-native
   ```
   Then rebuild the native app (`npm run run:ios` / `npm run run:android`).
   Web Checkout needs no client SDK.

5. **Install the server dep + deploy functions** (the `stripe` package was added
   to `functions/package.json`):
   ```bash
   cd functions && npm install && cd ..
   npm run deploy:functions
   ```

### Activating the webhook

1. Deploy functions first (step 5 above) so the endpoint exists at:
   ```
   https://us-central1-tradie-mate-f852a.cloudfunctions.net/stripeWebhook
   ```
2. Stripe Dashboard → **Developers → Webhooks → Add endpoint**. Paste that URL.
3. Subscribe to these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy the endpoint's **Signing secret** (`whsec_...`) into
   `functions/.env` as `STRIPE_WEBHOOK_SECRET`, then redeploy functions.
5. Test from the Dashboard ("Send test webhook") or with the Stripe CLI:
   ```bash
   stripe listen --forward-to https://us-central1-tradie-mate-f852a.cloudfunctions.net/stripeWebhook
   stripe trigger payment_intent.succeeded
   ```

> The webhook returns 404 when `PAYMENTS_LIVE=false` and 400 on a bad/missing
> signature, so it's safe to leave deployed while payments are off.

### Testing with Stripe test cards

In live-test mode (test keys), use `4242 4242 4242 4242`, any future expiry, any
CVC/postcode. Recharges credit the wallet; check the Wallet screen history.

---

## Web Push (browser notifications)

In-app notifications already update live on web (Firestore). Web push adds real
OS-level notifications, including when the tab is backgrounded (via a service
worker). **Off by default.**

### Enabling web push

1. **Get the VAPID key**: Firebase Console → Project settings → **Cloud
   Messaging** → "Web Push certificates" → generate / copy the key pair.

2. **Client env** (`.env.local`):
   ```
   EXPO_PUBLIC_WEB_PUSH_ENABLED=true
   EXPO_PUBLIC_FIREBASE_VAPID_KEY=BL...your_key...
   ```

3. **Build & deploy web** — the service worker lives at
   `public/firebase-messaging-sw.js` and is copied into `dist/` by the Metro web
   build, then served from the hosting root:
   ```bash
   npm run deploy:hosting
   ```

### How it works

- On login (web), `useWebNotifications` requests notification permission,
  registers the service worker, and stores the browser's FCM token as
  `users.webPushToken`.
- The Cloud Functions push helper (`sendPushToUser`) delivers to **both**
  `fcmToken` (native) and `webPushToken` (web), and prunes dead tokens.
- Foreground messages refresh the in-app feed; background messages show a
  system notification (handled by the service worker).

### Notes

- Web push needs **HTTPS** (works on the deployed Firebase Hosting URL; on
  `localhost` it works in Chrome but the service worker must be served from the
  root — use a production-style build, not the Metro dev server).
- Safari/iOS web push requires the site to be installed to the home screen
  (PWA) and a supported OS version.
- If the flag is off or the VAPID key is blank, registration is a no-op and the
  app falls back to the live in-app feed.
