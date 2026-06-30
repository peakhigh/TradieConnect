# Delivery Roadmap — Phased Plan

A dependency-aware sequencing of the work in `tasks-customer-module.md`, `tasks-tradie-module.md`, and `tasks-app-common.md`. Phases are ordered so each builds on real, working functionality from the previous one. We deliver incrementally — not everything ships day one, and unbuilt features are simply absent from the UI, never faked (see `no-mock-rule.md`).

Legend: `[ ]` todo · `[~]` partial/exists · `[x]` done · **(C)** customer · **(T)** tradie · **(A)** app-common

---

## Phase 0 — Foundations & Data Truth (unblocks everything) ✅ Done

Goal: remove all mock/stub data from app code and seed a real dataset so every later phase can be seen working.

- [x] (A) Fix `UserContext` — replace hardcoded empty `quotes` / `messages` / `unreadMessageCount` with real Firestore subscriptions.
- [x] (A) Standardize field names project-wide: `fcmToken`, notification `read`, add `goto` + `itemId`.
- [x] (A) Confirm intelligence is flat `intel_*` on `serviceRequests`; remove legacy `requestIntelligence` references.
- [x] (A) Add chat `appConfig` flag `chat.openRoomOn = 'quote' | 'accept'` (default `'quote'`).
- [x] (A) Tighten core types (`User`/`Customer`/`Tradie`/`Quote`/`ChatRoom`/`ChatMessage`); reduce `(user as any)`.
- [x] (A) Seed scripts: users, requests+quotes (lifecycle + `intel_*` + 90-day spread). npm `seed:all` / `clean:all` with `mock:true` tag + project allowlist guard.
- [x] (A) Remove legacy duplicates: `customer/MessagesScreen.tsx`, `tradie/ServiceRequestExplorer.tsx`, `explorerServiceWithFallback.ts`; strip `AppNavigator` debug logs.

**Exit criteria:** App runs on seeded data with zero mock code; dashboards read real counts. ✅

---

## Phase 1 — Core Marketplace Loop (post → quote → accept → complete → rate) ✅ Done

Goal: the money-making path works end-to-end for both roles. Depends on Phase 0.

- [x] (A) Consolidate explorer services into one documented `explorerService.ts`.
- [x] (T) Explorer: real `unlockServiceRequest` (balance check, deduct, quote doc, wallet txn) — no mock wallet; insufficient-balance → recharge modal.
- [x] (T) Submit Quote: verified `submitQuote` + error handling (`already-exists` / `permission-denied`).
- [x] (C) Quote Accept: pass real address/phone to `acceptQuote` (collected in QuoteCard modal).
- [x] (A) `declineQuote` Cloud Function + wire `QuoteCard` decline.
- [x] (C) `QuoteCard` confirmations → cross-platform `Modal` (no `Alert.alert`).
- [~] (C) Request detail / quote review: handled in-chat via `QuoteCard` (accept/decline) + `CompleteJobModal`; no dedicated `RequestDetailScreen` was built.
- [x] (C) Complete job flow → `completeServiceRequest` + rating form (`CompleteJobModal`).
- [x] (A) `rateTradie` (write rating, update tradie aggregate) — handled by `completeServiceRequest`.
- [x] (C) Dashboard "Recent Quotes": real quotes; Active Jobs section; Chat wired (removed "coming soon").
- [x] (T) Wallet: amount picker ($5/$10/$20/$50/custom) instead of fixed $10.
- [x] (A) Seed: requests now get `assigned`/`quoted` status aligned to their quotes.

**Exit criteria:** Customer posts → tradie unlocks (real $) → quotes → customer accepts → completes → rates; tradie history + wallet reflect it. ✅

---

## Phase 2 — Messaging & Notifications ✅ Done (web push deferred)

Goal: real-time chat per quote + working push/in-app notifications. Depends on Phase 1 (chat rooms are created on quote).

- [x] (A) `chatService.ts` (subscriptions + send + mark-read) — extracted inline chat logic.
- [x] (C/T) Chat: image messages render as real thumbnails via `ImageViewer`; documents open on tap.
- [x] (C/T) Chat list: filters (quote status, unread-only) + search by name/trade/suburb.
- [x] (A) Extend `onChatMessageCreated`: `lastMessageType` + notification dedup + clear invalid `fcmToken`.
- [x] (A) `NotificationsContext` wrapped in `App.tsx`; web real-time subscribe, mobile one-shot.
- [x] (A) Invoke `useMobileNotifications` after login (`PushRegistrar`).
- [x] (A) Unread badges in nav (bottom tabs + web sidebar: Messages & Notifications).
- [x] (A) `NotificationsScreen` + mark-as-read/all; tap routes to chat/request/wallet.
- [x] (A) Indexes: chat + dedup added.
- [x] (A) Seed: rooms carry participants/quoteStatus/trades/suburb/type + text msgs; notifications seeded.
- [x] (A) Web push via VAPID + service worker — implemented behind `EXPO_PUBLIC_WEB_PUSH_ENABLED` + `EXPO_PUBLIC_FIREBASE_VAPID_KEY`. SW at `public/firebase-messaging-sw.js`; token stored as `users.webPushToken`; backend `sendPushToUser` delivers to native + web tokens. Off by default until the VAPID key is set.

**Exit criteria:** Messages flow live between roles; badges update; push + in-app notifications fire and deep-link. ✅

---

## Phase 3 — Tradie Reporting & Insights (key selling feature) ✅ Done

Goal: the analytics suite. Depends on Phase 1 (real quotes/requests) and Phase 0 seed spread. See `tradie-reporting.md`.

- [x] (T/A) Rollup collections + `rollups.ts` increment helpers hooked into onCreate/unlock/submitQuote/complete.
- [x] (T/A) Nightly `reconcileReportingRollups` scheduled function (03:00 AEST).
- [x] (T/A) `suburbAdjacency` built for dev via `bin/data/backfillReporting.js` (production geo builder is a follow-up).
- [x] (T/A) Read callables: `getMySuburbReport`, `getNearbySuburbReport`, `getSuburbDetail`, `rankSuburbs`, `rankTrades` + `reportingService`.
- [x] (T/A) Reporting indexes added.
- [x] (T) Cross-platform charts: `BarComparison` (Views) + `DonutShare` (react-native-svg) — no new dependency added.
- [x] (T) Screens: `InsightsScreen`, `SuburbRankingsScreen`, `SuburbDetailScreen`, `TradeOpportunityScreen`; added to `TradieTabs` + web sidebar.
- [x] (T) Dashboard Analytics button → Insights.
- [x] (A) Reporting rollups for seeded data via `bin/data/backfillReporting.js` (mirrors `reconcile.ts`); wired into `seed:all` / `seed:reset` / `seed:reporting`.
- [x] (T) Dashboard real stats + Recent Activity feed — stats read from the user doc; Recent Activity merges live `quotes` + `walletTransactions` (real-time) on `TradieDashboard`. Removed the fake `setTimeout` loader.

**Exit criteria:** Tradie sees suburb/trade money + demand rankings, nearby opportunities, and trends with charts on all 3 platforms. ✅

---

## Phase 4 — Profiles, Settings & Polish ✅ Done

Goal: complete account management and remaining nav surfaces. Depends on Phases 0–2.

- [x] (C) Address (saved, used to prefill quote acceptance) + notification prefs (Settings) + delete account (`deleteUserData` CF).
- [x] (T) Profile: business details + **trades/suburbs management** (editable) + Settings/Help links + delete account.
- [x] (A) Real `SettingsScreen` (notification prefs persisted to `users.notificationPrefs` + delete account) and `HelpScreen` (role-aware FAQ) — replaced blank placeholders.
- [x] (A) Extended web `linking` config: Messages, Chat, Wallet, Insights (+ sub-screens), Interests, SubmitQuote, Notifications, Settings, Help.
- [~] (A) Auth: `SignupScreen` left as an alias of `LoginScreen` — phone OTP handles both new + existing users (a real flow, not a stub); dedicated signup not needed.
- [x] (C/T) History polish: tradie **Quotes / Completed Jobs tabs** + status vocab alignment (unlocked/quoted/accepted/rejected).
- [x] (T) Onboarding: `completeOnboarding` CF credits the $10 bonus (idempotent) + sets `onboardingCompleted`; success step calls it and refreshes.

**Exit criteria:** Every nav destination is real; profiles fully editable; auth/onboarding verified. ✅

---

## Phase 5 — Admin, Payments & Hardening 🔶 Code complete · QA + deploy pending

Goal: admin tooling, real payments, security, deploy. Depends on prior phases.

- [x] (A) Admin dashboard rebuilt (cross-platform StyleSheet): real users list + pending approvals + recent users.
- [x] (A) Admin: real revenue + unlock totals via `getAdminStats` CF; tradie approval + user suspend/reactivate via `adminSetTradieApproval` / `adminSetUserStatus` (admin-checked CFs). All "coming soon" removed.
- [x] (T/A) Payments: real Stripe integration wired behind `PAYMENTS_LIVE` (server) + `EXPO_PUBLIC_PAYMENTS_LIVE` (client). Server: `createPaymentIntent` (native PaymentSheet), `createCheckoutSession` + `confirmCheckoutRecharge` (web hosted Checkout), `rechargeWallet` verifies the Stripe charge (status/amount/currency/owner) and credits idempotently via shared `creditWallet`. Client: `payments.ts` runs PaymentSheet on native / Checkout redirect on web; dev credit when the flag is off. Needs a Stripe account + `STRIPE_SECRET_KEY` / `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` to go live.
- [x] (A) `deleteUserData` callable (done in Phase 4).
- [x] (A) Rewrote `firestore.rules`: auth-gated, money/CF-only collections read-only to clients, default-deny (replaced the open `allow if true`). Needs `deploy:rules` + a test pass before production.
- [~] (A) Migration `intel_*`/`tradesLower`/`searchKeywords`: seed writes all fields; a prod backfill script is a documented follow-up (couldn't validate vs prod). Index pruning deferred (removing a live index is risky).
- [x] (A) Seed: added admin user + 2 pending tradies + `isApproved`/`signupBonusGranted` so admin flows have real data.
- [ ] (A) Full QA pass on seeded data across iOS/Android/Web; verify empty states after `clean:all` (needs your running emulator/devices).
- [ ] (A) Deploy: `deploy:indexes`, `deploy:rules`, `deploy:functions`, `deploy:hosting` (needs Firebase credentials — run when ready).

**Exit criteria:** Admin operational, real recharges, rules/indexes deployed, full cross-platform QA green.

---

## Dependency Summary

```
Phase 0 (data truth + seed)
   └─> Phase 1 (marketplace loop)
          ├─> Phase 2 (chat + notifications)
          ├─> Phase 3 (reporting)   [also needs Phase 0 seed spread]
          └─> Phase 4 (profiles/settings/polish)
                 └─> Phase 5 (admin + payments + hardening)
```

Phases 2, 3, and 4 can progress in parallel once Phase 1 is stable. Phase 5 is the final hardening pass.
