# Tradie Reporting & Market Insights

This is a **primary selling feature**. Tradies pay to be on the platform; the reporting suite is what keeps them here. The aim is to help a tradie answer:

- How are **my suburbs** performing for **my trades**?
- Which **nearby suburbs** are doing well in my trades (where should I expand)?
- Pick **any suburb** — how is it performing right now?
- For a suburb: **# requests**, **$ value**, competition, average quote, win rates.
- **Rank** suburbs by money, request count, demand, low competition.
- How are **other trades** performing (should I learn/add a new trade)?
- All of the above sliced by **suburb × trade × money × time**, with clean charts and cards.

Everything must work on **iOS, Android, and Web** from one codebase.

---

## 1. The Core Problem: Firestore Can't Aggregate Cheaply at Read Time

Computing "total $ and # requests per suburb per trade over 90 days" by reading raw `serviceRequests`/`quotes` on every dashboard open is:
- Slow (hundreds–thousands of doc reads)
- Expensive (read costs scale with marketplace size)
- Impossible to sort/aggregate across fields within Firestore's query limits

**Decision: pre-aggregate into rollup collections, updated by Cloud Function triggers.** Same philosophy as the existing request-intelligence design (compute on write, read cheap). The reporting screens then read a *handful* of small rollup docs instead of scanning the marketplace.

This mirrors BuildOn's `getDashboardStats` approach (server-side `count()` + parallel queries) but goes further with **persisted rollups** because our analytics are multi-dimensional and historical.

---

## 2. Firestore Limitations We Must Design Around

| Limitation | Consequence | Our mitigation |
|-----------|-------------|----------------|
| No native GROUP BY / SUM across docs | Can't compute per-suburb totals in a query | Maintain rollup docs incremented on write |
| Composite index per query shape | Many filter combos explode index count | Aggregate offline; query rollups by a single deterministic doc ID |
| `array-contains-any` / `in` ≤ 30 values | Can't filter by many trades/suburbs at once | Loop in batches of ≤10/≤30; or read per-suburb rollup docs by ID |
| One range/inequality field per query | Can't filter money-range AND date-range together | Bucket by period in the doc ID; filter the rest client-side |
| `count()` aggregation reads are cheap but not free, and no SUM/AVG server aggregation for arbitrary fields (only count) | Can't SUM `$` server-side on the fly | Store running `totalValue`, `quoteCount` in rollups |
| Document write contention (~1 write/sec sustained per doc) | Hot suburb+trade+day doc could throttle under load | Shard counters if needed (`{docId}_shard{0..N}`), or aggregate via scheduled function instead of per-write trigger for hot keys |
| 1 MiB document limit | Can't stuff full history in one doc | One doc per (scope × period) bucket, not one giant doc |
| Geo queries not native | "Nearby suburbs" needs distance | Precompute a suburb adjacency / geo table; or use suburb centroids + bounding box |

---

## 3. Data Model — Rollup Collections

All rollups are **deterministic-ID** documents so a screen can fetch exactly the docs it needs by ID (no query/index needed for point lookups).

### 3.1 `suburbTradeStats` — the workhorse

One document per **suburb × trade × period bucket**.

- **Doc ID:** `{suburbKey}__{tradeKey}__{period}`
  - `suburbKey` = lowercased, normalized suburb (e.g. `bondi-2026`; include postcode to disambiguate duplicate suburb names across states)
  - `tradeKey` = lowercased trade (e.g. `plumbing`)
  - `period` = `all` | `YYYY-MM` (monthly) | `YYYY-Www` (weekly). Store at least `all` + monthly.

| Field | Type | Notes |
|-------|------|-------|
| `suburbKey` | string | For collection-group queries |
| `suburb` | string | Display name |
| `postcode` | string | |
| `state` | string | |
| `tradeKey` | string | |
| `trade` | string | Display name |
| `period` | string | `all` / `YYYY-MM` / `YYYY-Www` |
| `requestCount` | number | # service requests in scope |
| `activeRequestCount` | number | currently open |
| `completedCount` | number | jobs completed |
| `quoteCount` | number | total quotes submitted |
| `unlockCount` | number | total unlocks |
| `totalQuotedValue` | number | Σ quote totalPrice |
| `acceptedValue` | number | Σ accepted quote totalPrice (real $ flowing) |
| `avgQuoteValue` | number | `totalQuotedValue / quoteCount` (stored, not computed at read) |
| `avgAcceptedValue` | number | |
| `minQuoteValue` / `maxQuoteValue` | number | |
| `avgQuotesPerRequest` | number | competition proxy |
| `competitionLevel` | `'low'\|'medium'\|'high'` | derived from `avgQuotesPerRequest` |
| `demandLevel` | `'low'\|'medium'\|'high'` | derived from `requestCount` + unlocks |
| `lastActivityAt` | Timestamp | |
| `updatedAt` | Timestamp | |

**Why this shape:** any screen question becomes a *small, ID-based read* or a *single-field-sorted query*:
- "My suburbs for my trades" → fetch `suburbKey__tradeKey__all` docs by ID for each (suburb, trade) pair the tradie has (≤ a few dozen reads).
- "Rank suburbs by money for plumbing" → `collectionGroup('suburbTradeStats').where('tradeKey','==','plumbing').where('period','==','all').orderBy('acceptedValue','desc').limit(20)` — one index, one query.
- "How is suburb X doing across trades" → `where('suburbKey','==','bondi-2026').where('period','==','all').orderBy('acceptedValue','desc')`.

### 3.2 `suburbStats` — suburb totals across all trades

Doc ID: `{suburbKey}__{period}`. Same metrics as above but aggregated over all trades. Powers the "select a suburb, see overall performance" view and the cross-trade comparison ("how other trades are doing here").

### 3.3 `tradeStats` — trade totals across all suburbs

Doc ID: `{tradeKey}__{period}`. Powers "should I learn a new trade?" — compare demand/money of trades the tradie does *not* currently offer.

### 3.4 `suburbAdjacency` — for "nearby suburbs"

Doc ID: `{suburbKey}`. Precomputed neighbors (Firestore has no geo grouping).

| Field | Type | Notes |
|-------|------|-------|
| `suburb` / `postcode` / `state` | | |
| `lat` / `lng` | number | centroid |
| `neighbors` | array | `[{ suburbKey, suburb, postcode, distanceKm }]` sorted by distance, ~15–25 entries |

Built once from an AU suburb/postcode dataset (offline script), refreshed rarely. "Nearby suburbs doing well in my trade" = read `suburbAdjacency/{home}` → take neighbor `suburbKey`s → batch-read their `suburbTradeStats` docs by ID.

### 3.5 (Optional) `tradieStats` — personal performance

Doc ID: `{tradieId}__{period}`. The tradie's own quotes, wins, win rate, $ earned, avg quote, by trade/suburb. Lets reports contrast "you vs the market".

---

## 4. How Rollups Get Updated

### Trigger-based (primary)
Extend existing request/quote Cloud Functions. Whenever the underlying lifecycle changes, increment the relevant rollups inside the same transaction/batch:

| Event (existing fn) | Rollup updates |
|--------------------|----------------|
| `onServiceRequestCreated` | +1 `requestCount`, +1 `activeRequestCount` on the matching `suburbTrade`/`suburb`/`trade` `all` + current month docs |
| `unlockServiceRequest` | +1 `unlockCount` |
| `submitQuote` | +1 `quoteCount`, += `totalQuotedValue`, recompute `avg*`, `competitionLevel` |
| `acceptQuote` | += `acceptedValue`, +1 `completedCount` pathway |
| `completeServiceRequest` | +1 `completedCount`, -1 `activeRequestCount` |

Use `FieldValue.increment()` for counters. Recompute derived averages from stored sums (`avg = sum / count`) in the same write so reads never compute.

A request can list multiple trades → update one `suburbTradeStats` doc **per trade** on the request.

### Scheduled reconciliation (safety net)
A nightly scheduled function recomputes `all`-period docs for suburbs/trades touched that day (drift correction, handles missed triggers, and recomputes `avg`/levels). Also the cleanest place to compute things that can't be incrementally maintained accurately.

### Hot-key sharding (only if needed)
If a single popular (suburb, trade, day) doc exceeds ~1 write/sec, split counters across `N` shard docs and sum on read. Start without sharding; add when load testing shows contention.

---

## 5. Backend Read API

Expose a small set of **callable** functions (reuse BuildOn's `getDashboardStats` server-query pattern in `backend/dashboard.js`). Reports read rollups, not raw collections.

| Callable | Input | Returns |
|----------|-------|---------|
| `getMySuburbReport` | `{ suburbKeys[], tradeKeys[], period }` | rollup docs for the tradie's suburbs×trades + summary |
| `getNearbySuburbReport` | `{ homeSuburbKey, tradeKeys[], period, limit }` | neighbor suburbs ranked by money/demand |
| `getSuburbDetail` | `{ suburbKey, period }` | suburb totals + per-trade breakdown |
| `rankSuburbs` | `{ tradeKey, period, sortBy, limit }` | top suburbs for a trade by `acceptedValue` / `requestCount` / `demandLevel` |
| `rankTrades` | `{ suburbKey?, period, sortBy, limit }` | trades ranked (for "learn a new trade") |

Client hook: `useReport(callableName, params)` (thin wrapper over `runCloudFunction`, same shape as `useDashboardStats`).

> Direct client reads are also fine for pure ID-based lookups (rollups are non-sensitive, aggregate data). Use callables where we want to hide raw data or apply ranking with `orderBy` + `limit`.

---

## 6. Screens & Components (cross-platform)

All built with **Gluestack UI + NativeWind + Styled Components**, responsive, no new UI libs (per `ui-components.md`). Filters slide from the **right** (`FilterDrawer`); confirmations use the cross-platform `Modal` pattern.

### Screens
| Screen | Purpose |
|--------|---------|
| `app/screens/tradie/InsightsScreen.tsx` | Reporting home: "My Market" overview (my suburbs × my trades), headline stat cards, top movers |
| `app/screens/tradie/SuburbDetailScreen.tsx` | Deep dive on one suburb (per-trade table + charts) |
| `app/screens/tradie/SuburbRankingsScreen.tsx` | Ranked list (by money / requests / demand / low competition) with sort + filter drawer |
| `app/screens/tradie/TradeOpportunityScreen.tsx` | "Trades you don't offer" ranked by opportunity (learn-a-new-trade) |

### Components
| Component | Purpose |
|-----------|---------|
| `app/components/reports/StatCard.tsx` | Reuse existing `StatCard` (requests, $, avg quote, win rate) |
| `app/components/reports/SuburbStatRow.tsx` | Ranked row: suburb, $, #requests, competition badge, trend arrow |
| `app/components/reports/TrendChart.tsx` | Line/area chart of money/requests over months |
| `app/components/reports/BarComparison.tsx` | Bar chart comparing suburbs or trades |
| `app/components/reports/DonutShare.tsx` | Trade/suburb share of value |
| `app/components/reports/ReportFilters.tsx` | Right-drawer: trade(s), suburb(s), period, sort, money range |
| `app/components/reports/MetricToggle.tsx` | Switch metric: Money / Requests / Quotes / Demand |

### Charting library (cross-platform)
Charts must render on web + native from one codebase. Recommended: **`react-native-gifted-charts`** (works on iOS/Android/Web, no native linking, pairs with `react-native-svg` which RN/Expo already supports). Alternative: `victory-native` (XL uses Skia → heavier). **Decision: evaluate `react-native-gifted-charts` first** — confirm web build before committing. Whatever is chosen, isolate it behind our `reports/*Chart.tsx` wrappers so it can be swapped without touching screens. This is the one place we may add a dependency; document the rationale per `coding-standards.md`.

---

## 7. Mapping Each Requested Capability → Implementation

| Requested (from brief) | How it's served |
|------------------------|------------------|
| a) My suburbs doing for my trades | `getMySuburbReport` → grid of `StatCard` + `SuburbStatRow` per (suburb, trade) |
| b) Nearby suburbs good in my trades | `suburbAdjacency` neighbors → `getNearbySuburbReport` ranked |
| c) Select a suburb, see performance | `SuburbDetailScreen` → `getSuburbDetail` (suburb totals + per-trade) |
| d) #requests, #money per suburb | `requestCount`, `acceptedValue`/`totalQuotedValue` fields on rollups |
| e) Order suburbs by money / request count | `rankSuburbs` with `orderBy(acceptedValue|requestCount|demandLevel)` |
| f) How other trades perform | `rankTrades` (+ filter to trades not in tradie profile) → `TradeOpportunityScreen` |
| g) Variety of suburb/trade/money views with charts | `TrendChart`, `BarComparison`, `DonutShare`, `MetricToggle` |
| h) Help them as much as possible | Insights: "best opportunity", "low competition + high money" highlighted cards |
| i) Plan DB accordingly | Rollup collections in §3 |
| j) Respect Firebase query limits | §2 mitigations + deterministic IDs + pre-aggregation |
| k) Works on iOS/Android/Web | Gluestack + cross-platform chart wrappers |

---

## 8. Indexes Needed (reporting)

| Collection | Fields | Purpose |
|-----------|--------|---------|
| `suburbTradeStats` | `tradeKey` + `period` + `acceptedValue` DESC | rank suburbs by money for a trade |
| `suburbTradeStats` | `tradeKey` + `period` + `requestCount` DESC | rank suburbs by demand |
| `suburbTradeStats` | `suburbKey` + `period` + `acceptedValue` DESC | suburb's trades by money |
| `suburbStats` | `period` + `acceptedValue` DESC | top suburbs overall |
| `tradeStats` | `period` + `requestCount` DESC | hottest trades |
| `tradeStats` | `suburbKey?` (if per-suburb tradeStats added) | — |

Point lookups by deterministic doc ID need **no** index.

---

## 9. Build Order

1. Define rollup TS interfaces in `app/types/reporting.ts` + `functions/src/types`.
2. Add rollup update helpers in `functions/src/modules/reporting/rollups.ts`; call from existing request/quote functions.
3. Backfill script: compute rollups from existing `serviceRequests` + `quotes` (`scripts/backfillReportingRollups.js`).
4. Build `suburbAdjacency` from AU suburb dataset (`scripts/buildSuburbAdjacency.js`).
5. Add reporting indexes; deploy.
6. Callable read API + `useReport` hook.
7. Chart wrappers (pick + validate chart lib on web).
8. `InsightsScreen` → `SuburbRankingsScreen` → `SuburbDetailScreen` → `TradeOpportunityScreen`.
9. Nightly reconciliation scheduled function.
10. Add sharding only if load testing shows write contention on hot keys.
