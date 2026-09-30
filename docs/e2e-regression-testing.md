# E2E Regression Testing Plan

End-to-end regression suite to verify **every** user-facing path (UI **and**
data) before any production change. Single codebase → tests must cover **iOS,
Android, and Web**.

> Strategy: **Maestro (mobile) + Playwright (web) + a shared `firebase-admin`
> data-assertion layer**, all run against the Firebase **emulator suite** with
> seed data. Never against production.

---

## 1. Goals & Principles

- **Regression safety first.** The whole suite must be green before touching prod.
- **UI + data.** Every flow asserts both what the user sees AND the resulting
  Firestore/Auth state. On-screen text alone is not enough.
- **Emulators, never prod.** Tests run against the local emulator suite with
  script-seeded data (real backend, seed *data* only — no faked behavior).
- **Cross-platform parity.** Core flows run identically on iOS, Android, Web.
- **Deterministic.** Seed a known dataset before each run; clean after.

---

## 2. Strategy

No single tool drives all three platforms well, so we split by platform and share
the data layer.

| Layer | Tool | Scope |
|-------|------|-------|
| Mobile UI (iOS + Android) | **Maestro** | YAML flows; same file runs on both. |
| Web UI | **Playwright** | Cross-browser; drives the served web build. TradieConnect uses real URL routing, so specs navigate by path. |
| Data assertions | **`firebase-admin`** | Shared assert/seed layer (same Admin-SDK pattern as `bin/data/*`). |
| Backend under test | **Firebase Emulator Suite** | auth / firestore / storage / functions, seeded via `bin/data/seed.js`. |

### Who tests what (important)

Maestro and Playwright are **UI-driving** tools — they don't assert the database.
Every user-facing path is two halves:

1. **UI half** — Maestro (mobile) and/or Playwright (web) drives the flow.
2. **Data half** — the `firebase-admin` helper asserts the resulting Firestore/
   Auth state.

Some behavior has **no UI half** and is covered purely at the data layer.

| Layer | Tool | Covers |
|-------|------|--------|
| Mobile UI flows | **Maestro** | iOS + Android journeys |
| Web UI flows | **Playwright** | Browser journeys |
| Data assertions in UI flows | **`firebase-admin`** | Firestore/Auth state after each flow |
| Pure data / Cloud Function logic | **`firebase-admin` integration tests** | wallet math (`rechargeWallet`), `unlockServiceRequest` deduction, `submitQuote`, reliability metrics — no UI |
| Unit tests | **Out of scope** | Separate effort, not part of this suite |

### Phone-OTP auth note

Login is **phone number + SMS OTP** (`signInWithPhoneNumber`). Real SMS can't run
in CI, but the **Firebase Auth emulator supports fixed test phone numbers** with
a preset verification code. E2E uses those: the seeded customer/tradie numbers
map to a known code (e.g. `123456`) configured on the Auth emulator, so the OTP
step is deterministic and offline.

### Key preconditions

1. **Isolated test env** (`.env.e2e`): enable all four emulator flags
   (`EXPO_PUBLIC_LOCAL_AUTH/FIRESTORE/STORAGE/FUNCTIONS=true`) so no test touches
   the live `tradie-mate-f852a` project.
2. **Stable selectors.** Shared components (`Button`, `SimpleButton`, `Input`) and
   nav (`BottomTabBar`, `WebSidebar`) emit `testID`s. Screens using raw
   `Pressable`/`TouchableOpacity` need explicit ids added (tracked below).

---

## 3. Paths to Verify (regression matrix)

Each path is **UI + a data assertion**. `P` = platform target (M = mobile/Maestro,
W = web/Playwright, MW = both).

### 3.1 Auth (unauthenticated)

| # | Path | Data assertion | P |
|---|------|----------------|---|
| A1 | Home → user-type select → Login (phone) → OTP → lands in role tabs | session + `users/{uid}` doc, `userType` | MW |
| A2 | New phone → Signup → profile → user doc created | `users` doc with chosen `userType` | MW |
| A3 | Tradie first login → onboarding gate → completes → tradie tabs | `users.onboardingCompleted=true` + tradie profile | MW |
| A4 | Invalid OTP → error, no session | no session created | W |
| A5 | Resend OTP path works | new code accepted | W |

### 3.2 Customer

| # | Path | Data assertion | P |
|---|------|----------------|---|
| C1 | Post a service request (trade, postcode, description, urgency, photos) | `serviceRequests` doc with fields + owner | MW |
| C2 | View request detail + incoming quotes | quotes listed match `quotes` docs | W |
| C3 | Accept a quote | quote status + request status update | MW |
| C4 | Request history list + pagination | matches `serviceRequests` for customer | W |
| C5 | Profile edit | `users` profile update | MW |

### 3.3 Tradie

| # | Path | Data assertion | P |
|---|------|----------------|---|
| T1 | Explorer: browse/filter open requests | results match query | W |
| T2 | **Unlock a request (spends wallet)** | `walletTransactions` debit + `unlockedBy` set; balance decremented | MW |
| T3 | **Submit a quote after unlocking** | `quotes` doc created, linked to request + tradie | MW |
| T4 | **Wallet recharge (dev credit)** | `walletTransactions` credit + balance increased | MW |
| T5 | Insights / suburb rankings / trade opportunity render | reads reporting collections | W |
| T6 | Tradie onboarding (trades, suburbs, license) | tradie profile fields persisted | MW |
| T7 | Tradie history | matches unlocked/quoted requests | W |

### 3.4 Chat

| # | Path | Data assertion | P |
|---|------|----------------|---|
| H1 | Open chat room from a request/quote | `chatRooms` doc resolved | W |
| H2 | Send a message | message persisted; other party sees it | MW |

### 3.5 Cross-cutting

| # | Path | Data assertion | P |
|---|------|----------------|---|
| X1 | Notifications list renders | matches `notifications` | W |
| X2 | Settings + sign out | session cleared | MW |
| X3 | Cross-platform parity smoke (login, post request, unlock+quote) | same result iOS/Android/Web | MW |
| X4 | Admin dashboard renders aggregates | reads reporting collections | W |

**Totals:** ~23 distinct paths — 5 auth, 5 customer, 7 tradie, 2 chat, 4 cross-cutting.

The money loop (T2 unlock → T3 quote, T4 recharge) is the highest-risk cluster and
gets the strictest data assertions + pure-data Cloud Function tests.

---

## 4. Task Breakdown

### Phase 0 — Test environment (prerequisite)

- [ ] T0.1 `.env.e2e` with all emulator flags on (auth/firestore/storage/functions).
- [ ] T0.2 npm scripts: `e2e:env`, `e2e:emulators`, `e2e:seed`, `e2e:verify-isolation`.
- [ ] T0.3 Configure Auth-emulator test phone numbers → fixed OTP.
- [ ] T0.4 Verify emulator isolation + seed produces a known dataset.

### Phase 1 — Testability

- [ ] T1.1 `testID` + `accessibilityLabel` on `Button`, `SimpleButton`, `Input`.
- [ ] T1.2 `testID`s on nav (`BottomTabBar` items, `WebSidebar` items, sign out).
- [ ] T1.3 `testID`s on record cards (`RequestCard`) + row actions.
- [ ] T1.4 Naming convention (below).

### Phase 2 — Harness

- [ ] T2.1 Playwright config + `e2e/web/` + helpers.
- [ ] T2.2 Maestro `.maestro/` flows.
- [ ] T2.3 Shared `firebase-admin` data-assert/seed helper (`e2e/support/`).
- [ ] T2.4 Smoke tests (login) web + mobile.
- [ ] T2.5 npm scripts: `e2e:web`, `e2e:mobile`, `e2e:data`.

### Phase 3 — Fill the matrix (highest risk first)

- [ ] T3.1 Auth (A1–A5, phone-OTP via Auth emulator).
- [ ] T3.2 Money loop: unlock (T2), quote (T3), recharge (T4) + pure-data tests.
- [ ] T3.3 Customer (C1–C5).
- [ ] T3.4 Tradie remainder (T1, T5–T7).
- [ ] T3.5 Chat (H1–H2) + cross-cutting (X1–X4).

### Phase 4 — CI & maintenance

- [x] T4.1 CI job (`.github/workflows/e2e.yml`): `data-and-web` on Linux via
  `firebase emulators:exec` → `e2e/ci/run-suite.sh` (clean+seed → data tests →
  build+serve web → Playwright). A `mobile` job on macOS is scaffolded (gated
  to manual dispatch until the app build is wired).
- [x] T4.2 Artifacts: Playwright HTML report always; traces/screenshots on failure.
- [x] T4.3 Pre-prod gate: runs on PRs + pushes to `main`; make `data-and-web` a
  required status check to block merge/deploy on red.
- [ ] T4.4 Mobile job needs the iOS/Android app build (EAS/Expo prebuild) +
  simulator install step before it can run the Maestro flows.

---

## 4b. testID Naming Convention

Shared components emit stable `testID`s (mapped to `data-testid` on web by React
Native Web, to accessibility ids on native — one prop serves both harnesses).
When not passed explicitly, components derive one from their visible text/label.

| Component | testID pattern | Example |
|-----------|----------------|---------|
| `Button` / `SimpleButton` | `btn-<slug(title)>` | `btn-send-otp` |
| `Input` (container) | `input-<slug(label)>` | `input-mobile-number` |
| `Input` (field) | `input-<slug(label)>-input` | `input-mobile-number-input` |
| `Input` (error) | `input-<slug(label)>-error` | `input-mobile-number-error` |
| Bottom tab item | `tab-<route>` | `tab-Explorer` |
| Sidebar nav item | `nav-<route>` | `nav-Wallet` |
| Sign out | `nav-sign-out` | `nav-sign-out` |
| Record card | `card-<entity>-<id>` | `card-request-abc123` |
| Row action | `action-<action>-<id>` | `action-unlock-abc123` |

---

## 5. Proposed Layout

```
e2e/
├── web/          Playwright specs + helpers
├── data/         Pure data / integration tests (node:test via tsx)
├── support/      firebaseAdmin, assertData, seed, fixtures, testids
├── ci/run-suite.sh
├── playwright.config.ts
└── tsconfig.json

.maestro/         Maestro mobile flows (iOS + Android)
```

## 5b. Known selector gaps

Phase 1 adds testIDs to shared components. Screens using raw `Pressable`/
`TouchableOpacity` (Explorer filters, some card actions) need explicit ids before
their UI specs go green. The **data layer has no such gap** — it asserts Firestore/
Auth directly. UI specs self-skip where a control isn't found, so they don't
produce false failures, but are not proven-green until those ids are added.

### Seed findings (surfaced by the data suite)

- **Accepted quote on an open request:** `bin/data/seed.js`'s completed-jobs
  block can create an `accepted` quote whose parent `serviceRequest` is still
  `new` (status not flipped to `assigned`/`completed`). The data suite reports
  this as a warning rather than failing (so the suite stays green), and it
  should be fixed in the seed. This is a genuine data-consistency bug the
  regression tests caught — exactly their purpose.
- **Seed is not idempotent:** re-running `seed.js` without `clean.js` first
  accumulates requests. E2E runs must `clean` then `seed` for determinism
  (the CI runner does this).

### Screen-level selector gaps (verified against source)

Phase 1 added testIDs to shared components, but several screens need explicit
ids before their UI specs go fully green:

- **PostRequest** (`app/screens/customer/PostRequestScreen.tsx`): the `Input`s
  have **no `label`** (placeholder-only), so their derived testID is a slug of
  the placeholder. Specs use placeholder locators; adding `testID`s would be
  cleaner. Submit button title is **"Post Service Request"**.
- **Tradie Wallet recharge** is a **modal** (`Recharge Wallet` button → amount
  chips as custom `TouchableOpacity` → confirm). The chips need `testID`s;
  specs currently pick by `$` label.
- **Explorer unlock / SubmitQuote** controls need `testID`s on the cards/row
  actions; the T2/T3 spec self-skips until then and relies on data assertions.

The **data layer has no such gap** — all 8 data tests pass. UI specs self-skip
when a control isn't found (no false failures), but are not proven-green until
these ids land.

## 6. Open Decisions

- **Auth-emulator test numbers:** finalize the seeded phone→OTP map used by specs.
- **iOS in CI:** needs macOS runners (or Maestro Cloud).
- **Payments:** `EXPO_PUBLIC_PAYMENTS_LIVE=false` → recharge is a dev credit
  (testable headlessly). Live Stripe path is out of emulator scope.

## 7. Running

```bash
# terminal 1 — emulators (leave running)
npm run e2e:emulators
# terminal 2 — seed + test
npm run e2e:seed
npm run e2e:verify-isolation
npm run e2e:data                 # pure-data tests (fast)
cp .env.e2e .env && npm run web  # serve web against emulators
npm run e2e:web                  # Playwright web specs
MAESTRO_APP_ID=<bundle-id> npm run e2e:mobile
```
