# Tradie Module — Completion Task List

Derived from a code scan (June 2026). Work needed to finish the **tradie** experience end-to-end across iOS, Android, and Web.

Legend: `[ ]` todo · `[~]` exists but incomplete/stubbed · `[x]` done

> Cross-cutting rules apply (see `tasks-app-common.md`). Reporting/Insights detail lives in `tradie-reporting.md`.

---

## Current State (scan summary)

| Area | File | State |
|------|------|-------|
| Dashboard | `tradie/TradieDashboard.tsx` (230) | `[~]` Stats read straight off `user` doc; **Recent Activity empty**; "Analytics" action is a dead button |
| Explorer (new) | `tradie/ExplorerScreen.tsx` (913) | `[~]` Main browse screen — verify intelligence display, batch scroll, right filter drawer, real unlock |
| Explorer (old) | `tradie/ServiceRequestExplorer.tsx` (222) | `[~]` **Legacy**, uses **mock wallet balance + mock unlock** — remove or retire |
| Submit Quote | `tradie/SubmitQuoteScreen.tsx` (564) | `[~]` Form + intelligence panel; verify calls `submitQuote`, creates chat room (backend does) |
| Wallet | `tradie/WalletScreen.tsx` (216) | `[~]` Balance + history + recharge work, but **recharge is fixed $10**, no amount picker, no real payment |
| History | `tradie/TradieHistoryScreen.tsx` (218) | `[~]` Lists quotes; "completed jobs" not separated into tabs; status mapping pending↔quoted |
| Profile | `tradie/TradieProfileScreen.tsx` (329) | `[~]` Verify trades/suburbs/business edit + public preview |
| Onboarding | `tradie/onboarding/*` + `TradieOnboardingScreen.tsx` | `[~]` 6 steps present; verify $10 bonus credit + `onboardingCompleted` write |
| Insights/Reporting | — | `[ ]` **Does not exist** — the key selling feature (see `tradie-reporting.md`) |
| Messages | shared `chat/*` | `[~]` Same chat as customer; see chat tasks |

---

## 1. Dashboard (make it real)

- [ ] Replace static stats with live data: active quotes, jobs won, total earnings, rating, wallet balance.
- [ ] "Recent Activity" feed: latest unlocks, quotes submitted, accepted/rejected (read `quotes` + `walletTransactions`). Reuse a `getDashboardStats`-style callable (BuildOn pattern).
- [ ] Wire the "Analytics" quick action → new `InsightsScreen`.
- [ ] Low-wallet banner (dismissable) when balance < unlock cost.

## 2. Explorer (consolidate + verify)

- [ ] Retire/remove legacy `ServiceRequestExplorer.tsx` (mock wallet + mock unlock) — keep `ExplorerScreen.tsx`.
- [ ] Verify unlock goes through `unlockServiceRequest` Cloud Function (balance check, deduct, create quote doc `unlocked`, wallet txn) — no client mock.
- [ ] Verify locked vs unlocked card states + intelligence (`intel_*`) rendering from flat fields.
- [ ] Progressive batch scroll (10→50→"Load More") per `architecture-decisions.md`.
- [ ] Filters via right-slide `FilterDrawer`: trade, suburb/postcode, urgency, competition, opportunity, budget.
- [ ] Insufficient-balance path → prompt recharge (cross-platform modal).

## 3. Submit Quote

- [ ] Verify it calls `submitQuote` and handles `already-exists` / `permission-denied` errors with friendly messages.
- [ ] Confirm chat room + quote message creation (backend `submitQuote` does this) and navigate to chat or show success.
- [ ] Intelligence/recommended-price panel reads flat `intel_*` fields.
- [ ] Date pickers cross-platform; timeline auto-calc from start/completion.

## 4. Wallet & Payments

- [ ] Amount picker for recharge ($5/$10/$20/$50 + custom, min $5) — currently hardcoded $10.
- [ ] Integrate real payment processor (Stripe) behind `rechargeWallet` (currently just credits) — or document the integration point clearly.
- [ ] Show signup bonus + unlock debits with correct labels (works); verify `createdAt` vs `timestamp` field consistency.
- [ ] Handle recharge failure states + Toast.

## 5. History

- [ ] Split into tabs: **Quotes** (pending/quoted/accepted/rejected) and **Completed Jobs**.
- [ ] Reconcile status vocabulary: quotes use `unlocked|quoted|accepted|rejected`; screen maps `pending→Quoted`. Align labels.
- [ ] Completed jobs show final price + customer rating received.
- [ ] Tap → request/quote detail (read-only) + link to chat.

## 6. Profile

- [ ] Public profile preview (how customers see them: name, rating, trades, jobs).
- [ ] Edit business details (business name, ABN, license, insurance).
- [ ] Manage trades + service suburbs (multi-select) — feeds Explorer + reporting "my suburbs/my trades".
- [ ] Notification prefs + delete account.

## 7. Reporting & Insights (KEY SELLING FEATURE — see `tradie-reporting.md`)

- [ ] Rollup collections + backend update hooks + nightly reconciliation.
- [ ] Read callables (`getMySuburbReport`, `getNearbySuburbReport`, `getSuburbDetail`, `rankSuburbs`, `rankTrades`) + `useReport` hook.
- [ ] Cross-platform chart wrappers (validate `react-native-gifted-charts` on web).
- [ ] Screens: `InsightsScreen`, `SuburbRankingsScreen`, `SuburbDetailScreen`, `TradeOpportunityScreen`.
- [ ] `suburbAdjacency` build script (for "nearby suburbs").
- [ ] Add Insights to `TradieTabs` + web route in `AppNavigator`.

## 8. Onboarding

- [ ] Verify $10 signup bonus is credited (wallet txn type `bonus`) on completion.
- [ ] Verify `onboardingCompleted: true` write routes user to `TradieTabs`.
- [ ] Confirm trades + suburbs captured (drive Explorer + reporting).

## 9. Notifications (tradie-facing)

- [ ] Receive push + in-app for `new`-matching requests (optional), `quote_accepted`, `quote_rejected`, `chat_message`.
- [ ] Deep-link from notification to chat/request.

## 10. QA / Definition of Done (tradie)

- [ ] Seeded data renders every tradie screen including reporting.
- [ ] Full flow: browse → unlock (real $ deduct) → quote → chat → accepted → complete → rating received.
- [ ] Reporting screens render with charts on iOS, Android, Web.
- [ ] Legacy `ServiceRequestExplorer` removed; no mock wallet anywhere.
