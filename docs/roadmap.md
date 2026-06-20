# Delivery Roadmap — Phased Plan

A dependency-aware sequencing of the work in `tasks-customer-module.md`, `tasks-tradie-module.md`, and `tasks-app-common.md`. Phases are ordered so each builds on real, working functionality from the previous one. We deliver incrementally — not everything ships day one, and unbuilt features are simply absent from the UI, never faked (see `no-mock-rule.md`).

Legend: `[ ]` todo · `[~]` partial/exists · `[x]` done · **(C)** customer · **(T)** tradie · **(A)** app-common

---

## Phase 0 — Foundations & Data Truth (unblocks everything)

Goal: remove all mock/stub data from app code and seed a real dataset so every later phase can be seen working.

- [ ] (A) Fix `UserContext` — replace hardcoded empty `quotes` / `messages` / `unreadMessageCount` with real Firestore subscriptions.
- [ ] (A) Standardize field names project-wide: `fcmToken`, notification `read`, add `goto` + `itemId`.
- [ ] (A) Confirm intelligence is flat `intel_*` on `serviceRequests`; remove legacy `requestIntelligence` references.
- [ ] (A) Add chat `appConfig` flag `chat.openRoomOn = 'quote' | 'accept'` (default `'quote'`).
- [ ] (A) Tighten core types (`User`/`Customer`/`Tradie`/`Quote`/`ChatRoom`/`ChatMessage`); reduce `(user as any)`.
- [ ] (A) Seed scripts: users, requests+quotes (lifecycle + `intel_*` + 90-day spread). npm `seed:all` / `clean:all` with `seed:true` tag + project allowlist guard.
- [ ] (A) Remove legacy duplicates: `customer/MessagesScreen.tsx`, `tradie/ServiceRequestExplorer.tsx`, `explorerServiceWithFallback.ts`; strip `AppNavigator` debug logs.

**Exit criteria:** App runs on seeded data with zero mock code; dashboards read real counts.

---

## Phase 1 — Core Marketplace Loop (post → quote → accept → complete → rate)

Goal: the money-making path works end-to-end for both roles. Depends on Phase 0.

- [x] (A) Consolidate explorer services into one documented `explorerService.ts`.
- [x] (T) Explorer: real `unlockServiceRequest` (balance check, deduct, quote doc, wallet txn) — no mock wallet; insufficient-balance → recharge modal.
- [x] (T) Submit Quote: verified `submitQuote` + error handling (`already-exists` / `permission-denied`).
- [x] (C) Quote Accept: pass real address/phone to `acceptQuote` (collected in QuoteCard modal).
- [x] (A) `declineQuote` Cloud Function + wire `QuoteCard` decline.
- [x] (C) `QuoteCard` confirmations → cross-platform `Modal` (no `Alert.alert`).
- [ ] (C) `RequestDetailScreen`: quotes list + accept/decline + status actions.
- [x] (C) Complete job flow → `completeServiceRequest` + rating form (`CompleteJobModal`).
- [x] (A) `rateTradie` (write rating, update tradie aggregate) — handled by `completeServiceRequest`.
- [x] (C) Dashboard "Recent Quotes": real quotes; Active Jobs section; Chat wired (removed "coming soon").
- [x] (T) Wallet: amount picker ($5/$10/$20/$50/custom) instead of fixed $10.
- [x] (A) Seed: requests now get `assigned`/`quoted` status aligned to their quotes.

**Exit criteria:** Customer posts → tradie unlocks (real $) → quotes → customer accepts → completes → rates; tradie history + wallet reflect it.

---

## Phase 2 — Messaging & Notifications

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
- [ ] (A) Web push via VAPID + service worker (deferred — in-app real-time + native push cover current needs).

**Exit criteria:** Messages flow live between roles; badges update; push + in-app notifications fire and deep-link.

---

## Phase 3 — Tradie Reporting & Insights (key selling feature)

Goal: the analytics suite. Depends on Phase 1 (real quotes/requests) and Phase 0 seed spread. See `tradie-reporting.md`.

- [x] (T/A) Rollup collections + `rollups.ts` increment helpers hooked into onCreate/unlock/submitQuote/complete.
- [x] (T/A) Nightly `reconcileReportingRollups` scheduled function (03:00 AEST).
- [x] (T/A) `suburbAdjacency` seeded for dev (production builder script is a follow-up).
- [x] (T/A) Read callables: `getMySuburbReport`, `getNearbySuburbReport`, `getSuburbDetail`, `rankSuburbs`, `rankTrades` + `reportingService`.
- [x] (T/A) Reporting indexes added.
- [x] (T) Cross-platform charts: `BarComparison` (Views) + `DonutShare` (react-native-svg) — no new dependency added.
- [x] (T) Screens: `InsightsScreen`, `SuburbRankingsScreen`, `SuburbDetailScreen`, `TradeOpportunityScreen`; added to `TradieTabs` + web sidebar.
- [x] (T) Dashboard Analytics button → Insights.
- [x] (A) Seed/backfill reporting rollups from seeded data (inline in `seed.js`).
- [ ] (T) Dashboard real stats + Recent Activity feed (carried to Phase 4/tradie tasks).

**Exit criteria:** Tradie sees suburb/trade money + demand rankings, nearby opportunities, and trends with charts on all 3 platforms.

---

## Phase 4 — Profiles, Settings & Polish

Goal: complete account management and remaining nav surfaces. Depends on Phases 0–2.

- [ ] (C) Address book; notification prefs; delete account (Cloud Function).
- [ ] (T) Profile: public preview, business details, trades/suburbs management, prefs, delete account.
- [ ] (A) Build or remove blank `Notifications`/`Settings`/`Help` placeholder screens.
- [ ] (A) Extend web `linking` config: Messages, Chat, Wallet, Insights, Interests, SubmitQuote.
- [ ] (A) Auth: real `SignupScreen`/role flow (currently re-export of Login) or remove route.
- [ ] (C/T) History polish: customer detail view; tradie Quotes/Completed tabs + status vocab alignment.
- [ ] (T) Onboarding: verify $10 bonus credit + `onboardingCompleted` routing.

**Exit criteria:** Every nav destination is real; profiles fully editable; auth/onboarding verified.

---

## Phase 5 — Admin, Payments & Hardening

Goal: admin tooling, real payments, security, deploy. Depends on prior phases.

- [ ] (A) Admin: User Management, Accounts, Money/Transactions screens (replace all "coming soon").
- [ ] (A) Admin: real revenue + unlock totals from `walletTransactions`; tradie approval (`isApproved`); activity monitoring.
- [ ] (T/A) Real payment processor (Stripe) behind `rechargeWallet`.
- [ ] (A) `deleteUserData` callable.
- [ ] (A) Review `firestore.rules` for `chatRooms`/`messages`/rollups/`ratings`; prune duplicate indexes.
- [ ] (A) Migration/backfill: `intel_*` + `tradesLower` + `searchKeywords` on existing data.
- [ ] (A) Full QA pass on seeded data across iOS/Android/Web; verify empty states after `clean:all`.
- [ ] (A) Deploy: `deploy:indexes`, `deploy:rules`, `deploy:functions`, `deploy:hosting`.

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
