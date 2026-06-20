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

- [x] Retire/remove legacy `ServiceRequestExplorer.tsx` (mock wallet + mock unlock) — kept `ExplorerScreen.tsx`.
- [x] Unlock goes through `unlockServiceRequest` Cloud Function (balance check, deduct, quote doc, wallet txn) — no client mock; handled in `ServiceRequestCard`.
- [x] Locked vs unlocked card states + intelligence (`intel_*`) rendering from flat fields.
- [x] Progressive batch scroll (10→…→"Load More").
- [x] Filters via right-slide `FilterDrawer`.
- [x] Insufficient-balance path → warning modal prompting recharge.

## 3. Submit Quote

- [x] Calls `submitQuote` and handles `already-exists` / `permission-denied` errors with friendly messages.
- [x] Backend `submitQuote` creates chat room + quote message; screen shows success and returns to Explorer.
- [x] Intelligence/recommended-price panel reads flat `intel_*` fields (was reading nonexistent nested fields → fixed).
- [ ] Replace text date inputs with cross-platform date pickers; timeline auto-calc already works.

## 4. Wallet & Payments

- [x] Amount picker for recharge ($5/$10/$20/$50 + custom, min $5) via cross-platform modal — was hardcoded $10.
- [ ] Integrate real payment processor (Stripe) behind `rechargeWallet` (currently just credits) — documented integration point.
- [x] Signup bonus + unlock debits show with correct labels.
- [x] Recharge failure surfaces an inline error in the modal.

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

- [x] Rollup collections (`suburbTradeStats`/`suburbStats`/`tradeStats`) + update hooks in onCreate/unlock/submitQuote/complete.
- [x] Nightly `reconcileReportingRollups` scheduled function.
- [x] Read callables + `reportingService` (getMySuburbReport, getNearbySuburbReport, getSuburbDetail, rankSuburbs, rankTrades).
- [x] Cross-platform charts (`BarComparison`, `DonutShare`) using existing `react-native-svg` — no new lib.
- [x] Screens: `InsightsScreen`, `SuburbRankingsScreen`, `SuburbDetailScreen`, `TradeOpportunityScreen`; added to `TradieTabs` + web sidebar.
- [x] `suburbAdjacency` (seeded for dev) powering nearby-suburb reports.
- [ ] Production `suburbAdjacency` builder from a real AU postcode dataset.
- [ ] Monthly (`YYYY-MM`) period buckets + trend-over-time line charts (currently `all`-period only).

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
