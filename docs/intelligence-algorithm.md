# Intelligence Computation Algorithm

## The Problem

The Explorer screen shows rich market intelligence on every request card:
- Total quotes, price range, timeline range
- Competition level (low/medium/high)
- Opportunity score (0-100%)
- Win probability (0-100%)
- Recommended price range
- Market trends (price direction, demand level)

These need to be **pre-computed and stored** on the `serviceRequests` document so the Explorer can load them in a single query without joining multiple collections.

---

## Two Computation Trigger Points

### Trigger 1: Request Created (Customer submits)

When a customer posts a new request, we initialize the intelligence fields with defaults.

### Trigger 2: Quote Submitted (Tradie quotes)

When a tradie submits a quote, we recalculate all intelligence fields based on all quotes for that request.

---

## The Algorithm

### On Request Created

**Where:** Cloud Function `onServiceRequestCreated` (Firestore trigger)

**What it computes:**

```
intelligence = {
  totalQuotes: 0,
  totalUnlocks: 0,
  priceRange: { min: 0, max: 0, average: 0 },
  timelineRange: { minDays: 0, maxDays: 0, averageDays: 0 },
  breakdown: {
    materials: { min: 0, max: 0, average: 0 },
    labor: { min: 0, max: 0, average: 0 }
  },
  competitionLevel: "low",
  opportunityScore: 90,          // High — no competition yet
  competitivePosition: "strong",
  recommendedPriceRange: { min: 0, max: 0, optimal: 0 },
  winProbability: 0.85,          // High — first mover advantage
  priceGap: 0,                   // No spread yet
  marketTrends: { priceDirection: "stable", demandLevel: "low" },
  lastQuoteAt: null,
  updatedAt: serverTimestamp()
}
```

**Also computes (for filtering/sorting):**

```
// Flatten key fields to top level for Firestore querying
budgetMax: request.budget?.max || 0,
tradesLower: request.trades.map(t => t.toLowerCase()),
```

---

### On Quote Submitted

**Where:** Cloud Function `onQuoteCreated` (Firestore trigger on `quotes` collection)

**Input:** All quotes for the affected `serviceRequestId`

**Algorithm:**

```
function recalculateIntelligence(quotes[]):

  // --- Basic Aggregation ---
  totalQuotes = quotes.length
  prices = quotes.map(q => q.totalPrice)
  timelines = quotes.map(q => q.timelineDays)
  materials = quotes.map(q => q.materialsCost)
  labor = quotes.map(q => q.laborCost)

  priceRange = { min: min(prices), max: max(prices), average: avg(prices) }
  timelineRange = { min: min(timelines), max: max(timelines), average: avg(timelines) }
  breakdown = {
    materials: { min: min(materials), max: max(materials), average: avg(materials) },
    labor: { min: min(labor), max: max(labor), average: avg(labor) }
  }

  // --- Competition Level ---
  if totalQuotes < 3:  competitionLevel = "low"
  elif totalQuotes < 7: competitionLevel = "medium"
  else:                  competitionLevel = "high"

  // --- Price Gap (spread) ---
  priceGap = priceRange.max - priceRange.min
  priceGapCategory:
    if priceGap > 200: "large"
    elif priceGap > 100: "medium"
    else: "small"

  // --- Opportunity Score (0-100) ---
  score = 50  // base

  // Competition factor (40% weight)
  if totalQuotes == 0: score += 40
  elif totalQuotes < 3: score += 30
  elif totalQuotes < 5: score += 20
  elif totalQuotes < 8: score += 10
  else: score -= 10

  // Price spread factor (30% weight) — high spread = pricing opportunity
  spreadPct = (priceGap / avg(prices)) * 100
  if spreadPct > 50: score += 30
  elif spreadPct > 25: score += 20
  elif spreadPct > 10: score += 10

  // Budget factor (20% weight) — higher value jobs = better opportunity
  if avg(prices) > 2000: score += 20
  elif avg(prices) > 1000: score += 15
  elif avg(prices) > 500: score += 10

  // Freshness factor (10% weight)
  hoursOld = (now - request.createdAt) / hours
  if hoursOld < 2: score += 10
  elif hoursOld < 6: score += 5
  elif hoursOld > 48: score -= 10

  opportunityScore = clamp(score, 10, 100)

  // --- Win Probability ---
  baseProbability:
    if totalQuotes < 3: 0.75
    elif totalQuotes < 5: 0.55
    elif totalQuotes < 7: 0.40
    else: 0.25

  winProbability = clamp(baseProbability, 0.10, 0.90)

  // --- Competitive Position ---
  if totalQuotes < 3: "strong"
  elif totalQuotes < 7: "moderate"
  else: "weak"

  // --- Recommended Price Range ---
  recommendedPriceRange = {
    min: round(avg(prices) * 0.90),
    max: round(avg(prices) * 1.10),
    optimal: round(avg(prices) * 0.95)  // slightly below average wins
  }

  // --- Market Trends ---
  // Compare recent quotes vs older quotes
  if quotes.length >= 4:
    recentHalf = quotes.sortByDate().slice(0, half)
    olderHalf = quotes.sortByDate().slice(half)
    if avg(recentHalf.prices) > avg(olderHalf.prices) * 1.05: priceDirection = "up"
    elif avg(recentHalf.prices) < avg(olderHalf.prices) * 0.95: priceDirection = "down"
    else: priceDirection = "stable"
  else:
    priceDirection = "stable"

  demandLevel:
    if totalQuotes > 7: "high"
    elif totalQuotes > 3: "medium"
    else: "low"
```

---

## Final `serviceRequests` Document Schema

After computation, each serviceRequest document contains:

```typescript
interface ServiceRequestDocument {
  // --- Core fields (set by customer on creation) ---
  id: string;
  customerId: string;
  trades: string[];                    // ["Plumbing", "Gas Fitting"]
  description: string;
  postcode: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'new' | 'quoted' | 'assigned' | 'completed' | 'cancelled' | 'expired';
  photos: string[];
  documents: string[];
  voiceMessage: string | null;
  budget?: { min: number; max: number };

  // --- Computed search fields (set on creation) ---
  searchKeywords: string[];
  tradesLower: string[];               // for array-contains queries
  descriptionLower: string;

  // --- Embedded intelligence (set on creation, updated on each quote) ---
  intelligence: {
    totalQuotes: number;
    totalUnlocks: number;
    priceRange: { min: number; max: number; average: number };
    timelineRange: { minDays: number; maxDays: number; averageDays: number };
    breakdown: {
      materials: { min: number; max: number; average: number };
      labor: { min: number; max: number; average: number };
    };
    competitionLevel: 'low' | 'medium' | 'high';
    opportunityScore: number;          // 0-100
    competitivePosition: 'strong' | 'moderate' | 'weak';
    recommendedPriceRange: { min: number; max: number; optimal: number };
    winProbability: number;            // 0.0-1.0
    priceGap: number;                  // absolute $ spread
    priceGapCategory: 'small' | 'medium' | 'large';
    marketTrends: {
      priceDirection: 'up' | 'down' | 'stable';
      demandLevel: 'low' | 'medium' | 'high';
    };
    lastQuoteAt: Timestamp | null;
    updatedAt: Timestamp;
  };

  // --- Timestamps ---
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## `quotes` Collection Schema

```typescript
interface QuoteDocument {
  id: string;
  serviceRequestId: string;           // FK to serviceRequests
  tradieId: string;                   // FK to users
  tradieName: string;                 // denormalized
  tradieRating: number;               // denormalized at time of quote

  // --- Pricing ---
  totalPrice: number;
  materialsCost: number;
  laborCost: number;

  // --- Timeline ---
  timelineDays: number;
  estimatedStartDate: Timestamp;
  estimatedCompletionDate: Timestamp;

  // --- Meta ---
  notes: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
}
```

---

## `unlockTransactions` Collection Schema

```typescript
interface UnlockTransactionDocument {
  id: string;
  tradieId: string;
  serviceRequestId: string;
  amount: number;                     // always 0.50
  status: 'completed';
  createdAt: Timestamp;
}
```

**Decision: Keep `unlockTransactions` separate.** Don't merge with quotes because:
1. A tradie can unlock without quoting (they paid to look, decided not to quote)
2. Unlock is a financial transaction — needs its own audit trail
3. Different query patterns: "has this tradie unlocked?" vs "what quotes exist?"

---

## Firestore Limitations & Constraints

### Key Constraints That Affect Our Design

| Constraint | Impact |
|-----------|--------|
| **One `array-contains` / `array-contains-any` per query** | Can't filter by trades AND another array field simultaneously |
| **`in` / `array-contains-any` max 30 values** | If tradie selects 30+ trade filters, need to batch (unlikely) |
| **Inequality filters require matching `orderBy`** | `where('budget.max', '>=', X)` forces `orderBy('budget.max')` first — can't also `orderBy('createdAt')` in the same query without composite index |
| **Multiple inequalities on different fields** | Supported in Firestore v2 but requires composite indexes for every combination. Combinatorial explosion with our filter options. |
| **Can't range-query nested map fields efficiently** | `intelligence.opportunityScore >= 50` works but combining with other inequalities is impractical |
| **`orderBy` must match first inequality field** | If we filter `createdAt >= cutoff`, we must `orderBy('createdAt')` — can't then sort by opportunity score server-side |
| **No OR across different fields** | `urgency == 'high' OR trades contains 'plumbing'` impossible in one query |
| **Document size: 1MB max** | Our intelligence embed is ~2KB — no issue |
| **500 writes/sec per document** | Popular requests with simultaneous quotes could hit contention — unlikely at our scale |

### Why We Can't Do All Filters Server-Side

Consider this ideal query:
```
where(tradesLower, array-contains-any, ['plumbing'])  // array filter
where(urgency, in, ['high', 'medium'])                 // in filter
where(budget.max, >=, 500)                             // inequality #1
where(createdAt, >=, 24hAgo)                           // inequality #2
orderBy(createdAt, desc)                               // sort
```

**Problems:**
1. Two inequality fields (`budget.max` and `createdAt`) — needs composite index AND `orderBy` must start with first inequality field
2. If we `orderBy('budget.max')` first, we lose `createdAt` desc pagination
3. Every combination of filters would need its own composite index (dozens of indexes)
4. Composite indexes have a limit of ~200 per project

### Our Hybrid Strategy

**Server-side (Firestore query):** Minimal, reliable filtering
- `where('status', '==', 'new')` — always applied (only show active requests)
- `orderBy('createdAt', 'desc')` — always applied (newest first for pagination)
- Optionally ONE of: `array-contains-any(tradesLower)` OR `where('postcode', '==', X)`

**Client-side (after fetch):** Everything else
- Urgency filter
- Budget range
- Posted-within time filter
- All intelligence filters (competition, opportunity, win rate, price gap)
- All sort options except "Newest"

### Tradeoff: Over-Fetching

This means we fetch more documents than we display (some get filtered out client-side). At our scale this is fine:

| Scale | Active Requests | Fetch per page | After client filter | Cost |
|-------|----------------|----------------|--------------------|----|
| Early (now) | ~50-200 | 15 | 10-15 | Negligible |
| Growth | ~500-2000 | 15 | 8-15 | Still fine |
| Scale issue | 10,000+ | 15 | 2-3 | Need server-side filtering |

**When to revisit:** If client-side filtering consistently removes >50% of fetched docs, we should add composite indexes for the most common filter combinations.

### Composite Indexes We DO Need

These are the minimum indexes for our primary query patterns:

| Collection | Fields | Purpose |
|-----------|--------|---------|
| `serviceRequests` | `status` ASC, `createdAt` DESC | Explorer feed (primary query) |
| `serviceRequests` | `status` ASC, `tradesLower` ARRAY, `createdAt` DESC | Explorer with trade filter |
| `serviceRequests` | `customerId` ASC, `status` ASC, `createdAt` DESC | Customer dashboard |
| `quotes` | `serviceRequestId` ASC, `status` ASC | Quotes for a request |
| `quotes` | `tradieId` ASC, `createdAt` DESC | Tradie's quote history |
| `unlockTransactions` | `tradieId` ASC, `serviceRequestId` ASC | Unlock check |

---

## How Filters Map to Fields (Hybrid Approach)

### Server-Side (Firestore WHERE)

| Filter | Field | Query | Notes |
|--------|-------|-------|-------|
| Status | `status` | `where('status', '==', 'new')` | Always applied |
| Trade type | `tradesLower` | `array-contains-any` | Optional, max 30 values |
| Postcode | `postcode` | `where('postcode', '==', value)` | Optional, equality only |

**Rule:** Only ONE optional filter at a time alongside `status` + `orderBy(createdAt)`.

### Client-Side (Post-Fetch)

| Filter | Field | Logic |
|--------|-------|-------|
| Urgency | `urgency` | `includes` check |
| Budget range | `budget.max` | `>= min && <= max` |
| Posted within | `createdAt` | `>= (now - hours)` |
| Competition level | `intelligence.competitionLevel` | exact match |
| Opportunity score | `intelligence.opportunityScore` | range (min-max) |
| Win rate | `intelligence.winProbability` | `>= threshold` |
| Price gap | `intelligence.priceGapCategory` | exact match |
| Distance/closest | calculated from postcode | Haversine or lookup |

### Sort Options

| Sort | Implementation | Why |
|------|---------------|-----|
| Newest | `orderBy('createdAt', 'desc')` — **Firestore** | Primary sort, supports pagination |
| Best Opportunity | **Client-side** sort by `intelligence.opportunityScore` desc | Can't orderBy nested field with other constraints |
| Closest | **Client-side** sort by calculated distance | Distance isn't stored, calculated per-tradie |
| Highest Budget | **Client-side** sort by `budget.max` desc | Would need different orderBy, breaks pagination |

### Pagination Caveat

Client-side sorting breaks cursor-based pagination. When sorting by anything other than "Newest":
- We fetch a larger batch (e.g., 50 docs)
- Sort client-side
- Display in pages of 15
- "Load More" fetches next 50 from Firestore, merges, re-sorts

This is acceptable at our scale. At 10K+ active requests, we'd need server-side sorting with dedicated indexes per sort option.

---

## Cloud Function Implementation Plan

### Function 1: `onServiceRequestCreated`

**Trigger:** `onDocumentCreated('serviceRequests/{requestId}')`

**Actions:**
1. Read the new document
2. Set default `intelligence` object (all zeros, high opportunity score)
3. Compute `tradesLower` from `trades`
4. Write back to the same document

### Function 2: `onQuoteCreated`

**Trigger:** `onDocumentCreated('quotes/{quoteId}')`

**Actions:**
1. Read `serviceRequestId` from the new quote
2. Fetch ALL quotes for that `serviceRequestId`
3. Run `recalculateIntelligence(quotes)`
4. Update `serviceRequests/{serviceRequestId}.intelligence` with new values
5. Increment `intelligence.totalQuotes`

### Function 3: `onUnlockCreated` (optional)

**Trigger:** `onDocumentCreated('unlockTransactions/{id}')`

**Actions:**
1. Increment `serviceRequests/{serviceRequestId}.intelligence.totalUnlocks`

---

## What Changes from Current Code

| Current | New |
|---------|-----|
| Intelligence computed client-side in `explorerService.ts` | Intelligence pre-computed server-side, stored on document |
| Random values for win probability, market trends | Deterministic algorithm based on actual quote data |
| No Firestore-level filtering on trades/urgency | Server-side `where` clauses for data filters |
| All filtering is client-side | Hybrid: data filters server-side, intelligence filters client-side |
| `fetchServiceRequests` fetches ALL then filters | Fetches only matching docs, then applies intelligence filters |

---

## Migration Steps

1. Add Cloud Functions (`onServiceRequestCreated`, `onQuoteCreated`)
2. Run a one-time migration script to backfill `intelligence` on existing requests
3. Update `explorerService.ts` to use server-side `where` clauses for data filters
4. Remove client-side intelligence calculation (it's now pre-computed)
5. Keep client-side intelligence filtering (can't do range queries on nested fields in Firestore)
