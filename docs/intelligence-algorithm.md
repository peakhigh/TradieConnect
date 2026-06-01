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

## Collections Overview

| Collection | Purpose |
|-----------|---------|
| `serviceRequests` | Customer job postings + embedded intelligence fields |
| `quotes` | Tradie interactions — lifecycle: unlocked → quoted → accepted/rejected |
| `walletTransactions` | Financial audit trail (recharges, debits, bonuses) |
| `users` | User profiles (customer, tradie, admin) |
| `notifications` | In-app + push notification records |
| `ratings` | Individual rating records |

**No separate `unlockTransactions` collection.** Unlocks and quotes are merged into a single `quotes` collection with lifecycle statuses.

---

## The `quotes` Lifecycle

```
unlocked → quoted → accepted / rejected
```

| Status | Meaning | When |
|--------|---------|------|
| `unlocked` | Tradie paid $0.50 to see full details | On unlock click |
| `quoted` | Tradie submitted pricing/timeline | On quote submit |
| `accepted` | Customer chose this tradie | On customer accept |
| `rejected` | Customer chose someone else | When another quote is accepted |

A tradie who unlocks but never quotes stays at `status: 'unlocked'` forever. That's fine — it records they paid and looked.

---

## Three Computation Trigger Points

### Trigger 1: Request Created (Customer submits)

Initialize all intelligence fields with defaults.

### Trigger 2: Quote Unlocked (Tradie pays $0.50)

Create `quotes` doc with `status: 'unlocked'`. Increment unlock count on serviceRequest. Adjust demand level.

### Trigger 3: Quote Submitted (Tradie fills in pricing)

Update `quotes` doc to `status: 'quoted'`. Recalculate all intelligence fields based on all quoted entries.

---

## The Algorithm

### On Request Created

**Where:** Cloud Function `onServiceRequestCreated` (Firestore trigger)

**What it sets on the serviceRequest document:**

```
tradesLower: trades.map(t => t.toLowerCase())
status: "new"

intel_totalQuotes: 0
intel_totalUnlocks: 0
intel_priceMin: 0
intel_priceMax: 0
intel_priceAverage: 0
intel_timelineMinDays: 0
intel_timelineMaxDays: 0
intel_timelineAvgDays: 0
intel_materialsMin: 0
intel_materialsMax: 0
intel_materialsAvg: 0
intel_laborMin: 0
intel_laborMax: 0
intel_laborAvg: 0
intel_competitionLevel: "low"
intel_opportunityScore: 90
intel_competitivePosition: "strong"
intel_recommendedPriceMin: 0
intel_recommendedPriceMax: 0
intel_recommendedPriceOptimal: 0
intel_winProbability: 0.85
intel_priceGap: 0
intel_priceGapCategory: "small"
intel_priceDirection: "stable"
intel_demandLevel: "low"
intel_lastQuoteAt: null
intel_updatedAt: serverTimestamp()
```

---

### On Unlock (quotes doc created with status: 'unlocked')

**Where:** Inside the `unlockServiceRequest` callable Cloud Function (already runs server-side)

**What it does:**

1. Validate tradie, check balance, deduct $0.50
2. Create `quotes` doc:
```
{
  tradieId: "trad_001"
  serviceRequestId: "req_001"
  status: "unlocked"
  unlockAmount: 0.50
  unlockedAt: serverTimestamp()
  totalPrice: null
  materialsCost: null
  laborCost: null
  timelineDays: null
  estimatedStartDate: null
  estimatedCompletionDate: null
  notes: null
  quotedAt: null
  acceptedAt: null
  tradieName: "Mike Thompson"
  tradieRating: 4.8
  createdAt: serverTimestamp()
}
```
3. Create `walletTransactions` record (financial audit)
4. Update serviceRequest:
```
intel_totalUnlocks: FieldValue.increment(1)

// Update demand level
if intel_totalUnlocks > 10: intel_demandLevel = "high"
elif intel_totalUnlocks > 5: intel_demandLevel = "medium"

// Boost opportunity if many unlocks but few quotes (people looking, not quoting yet)
if intel_totalUnlocks > 3 and intel_totalQuotes < 3:
    intel_opportunityScore = min(current + 5, 100)

intel_updatedAt: serverTimestamp()
```

---

### On Quote Submitted (quotes doc updated to status: 'quoted')

**Where:** `submitQuote` callable Cloud Function

**What it does:**

1. Validate tradie has an existing `quotes` doc with `status: 'unlocked'` for this request
2. Update the existing `quotes` doc:
```
{
  status: "quoted"
  totalPrice: 280
  materialsCost: 80
  laborCost: 200
  timelineDays: 1
  estimatedStartDate: Timestamp
  estimatedCompletionDate: Timestamp
  notes: "Can come tomorrow morning."
  quotedAt: serverTimestamp()
}
```
3. Fetch ALL `quotes` docs for this `serviceRequestId` where `status == 'quoted'`
4. Recalculate intelligence:

```
function recalculateIntelligence(quotedDocs[], totalUnlocks):

  totalQuotes = quotedDocs.length
  prices = quotedDocs.map(q => q.totalPrice)
  timelines = quotedDocs.map(q => q.timelineDays)
  materials = quotedDocs.map(q => q.materialsCost)
  labor = quotedDocs.map(q => q.laborCost)

  intel_totalQuotes = totalQuotes
  intel_priceMin = min(prices)
  intel_priceMax = max(prices)
  intel_priceAverage = round(avg(prices))
  intel_timelineMinDays = min(timelines)
  intel_timelineMaxDays = max(timelines)
  intel_timelineAvgDays = round(avg(timelines), 1)
  intel_materialsMin = min(materials)
  intel_materialsMax = max(materials)
  intel_materialsAvg = round(avg(materials))
  intel_laborMin = min(labor)
  intel_laborMax = max(labor)
  intel_laborAvg = round(avg(labor))

  // --- Competition Level ---
  if totalQuotes < 3:  intel_competitionLevel = "low"
  elif totalQuotes < 7: intel_competitionLevel = "medium"
  else:                  intel_competitionLevel = "high"

  // --- Price Gap ---
  intel_priceGap = intel_priceMax - intel_priceMin
  if intel_priceGap > 200: intel_priceGapCategory = "large"
  elif intel_priceGap > 100: intel_priceGapCategory = "medium"
  else: intel_priceGapCategory = "small"

  // --- Opportunity Score (0-100) ---
  score = 50

  // Competition factor (40%)
  if totalQuotes == 0: score += 40
  elif totalQuotes < 3: score += 30
  elif totalQuotes < 5: score += 20
  elif totalQuotes < 8: score += 10
  else: score -= 10

  // Price spread factor (30%)
  spreadPct = (intel_priceGap / intel_priceAverage) * 100
  if spreadPct > 50: score += 30
  elif spreadPct > 25: score += 20
  elif spreadPct > 10: score += 10

  // Budget factor (20%)
  if intel_priceAverage > 2000: score += 20
  elif intel_priceAverage > 1000: score += 15
  elif intel_priceAverage > 500: score += 10

  // Freshness factor (10%)
  hoursOld = (now - request.createdAt) / hours
  if hoursOld < 2: score += 10
  elif hoursOld < 6: score += 5
  elif hoursOld > 48: score -= 10

  // Unlock-to-quote bonus
  if totalUnlocks > 3 and totalQuotes < 3: score += 5

  intel_opportunityScore = clamp(score, 10, 100)

  // --- Win Probability ---
  if totalQuotes < 3: intel_winProbability = 0.75
  elif totalQuotes < 5: intel_winProbability = 0.55
  elif totalQuotes < 7: intel_winProbability = 0.40
  else: intel_winProbability = 0.25

  // --- Competitive Position ---
  if totalQuotes < 3: intel_competitivePosition = "strong"
  elif totalQuotes < 7: intel_competitivePosition = "moderate"
  else: intel_competitivePosition = "weak"

  // --- Recommended Price Range ---
  intel_recommendedPriceMin = round(intel_priceAverage * 0.90)
  intel_recommendedPriceMax = round(intel_priceAverage * 1.10)
  intel_recommendedPriceOptimal = round(intel_priceAverage * 0.95)

  // --- Market Trends ---
  if quotedDocs.length >= 4:
    recentHalf = quotedDocs.sortByDate().slice(0, half)
    olderHalf = quotedDocs.sortByDate().slice(half)
    if avg(recentHalf.prices) > avg(olderHalf.prices) * 1.05: intel_priceDirection = "up"
    elif avg(recentHalf.prices) < avg(olderHalf.prices) * 0.95: intel_priceDirection = "down"
    else: intel_priceDirection = "stable"
  else:
    intel_priceDirection = "stable"

  totalInterest = totalUnlocks + totalQuotes
  if totalInterest > 12: intel_demandLevel = "high"
  elif totalInterest > 5: intel_demandLevel = "medium"
  else: intel_demandLevel = "low"

  intel_lastQuoteAt = latestQuotedDoc.quotedAt
  intel_updatedAt = serverTimestamp()
```

5. Write all `intel_*` fields back to `serviceRequests/{serviceRequestId}`
6. Send notification to customer

---

## Final `serviceRequests` Document Schema (Flat)

```typescript
interface ServiceRequestDocument {
  // --- Core fields (set by customer) ---
  id: string;
  customerId: string;
  trades: string[];
  tradesLower: string[];
  description: string;
  descriptionLower: string;
  postcode: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'new' | 'quoted' | 'assigned' | 'completed' | 'cancelled' | 'expired';
  photos: string[];
  documents: string[];
  voiceMessage: string | null;
  budgetMin: number;
  budgetMax: number;
  searchKeywords: string[];

  // --- Intelligence fields (flat) ---
  intel_totalQuotes: number;
  intel_totalUnlocks: number;
  intel_priceMin: number;
  intel_priceMax: number;
  intel_priceAverage: number;
  intel_timelineMinDays: number;
  intel_timelineMaxDays: number;
  intel_timelineAvgDays: number;
  intel_materialsMin: number;
  intel_materialsMax: number;
  intel_materialsAvg: number;
  intel_laborMin: number;
  intel_laborMax: number;
  intel_laborAvg: number;
  intel_competitionLevel: 'low' | 'medium' | 'high';
  intel_opportunityScore: number;
  intel_competitivePosition: 'strong' | 'moderate' | 'weak';
  intel_recommendedPriceMin: number;
  intel_recommendedPriceMax: number;
  intel_recommendedPriceOptimal: number;
  intel_winProbability: number;
  intel_priceGap: number;
  intel_priceGapCategory: 'small' | 'medium' | 'large';
  intel_priceDirection: 'up' | 'down' | 'stable';
  intel_demandLevel: 'low' | 'medium' | 'high';
  intel_lastQuoteAt: Timestamp | null;
  intel_updatedAt: Timestamp;

  // --- Timestamps ---
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## `quotes` Collection Schema (Flat — Merged Unlock + Quote)

```typescript
interface QuoteDocument {
  id: string;
  serviceRequestId: string;
  tradieId: string;
  tradieName: string;
  tradieRating: number;

  // --- Lifecycle ---
  status: 'unlocked' | 'quoted' | 'accepted' | 'rejected';

  // --- Unlock data (set on creation) ---
  unlockAmount: number;               // always 0.50
  unlockedAt: Timestamp;

  // --- Quote data (null until status = 'quoted') ---
  totalPrice: number | null;
  materialsCost: number | null;
  laborCost: number | null;
  timelineDays: number | null;
  estimatedStartDate: Timestamp | null;
  estimatedCompletionDate: Timestamp | null;
  notes: string | null;
  quotedAt: Timestamp | null;

  // --- Acceptance (null until status = 'accepted') ---
  acceptedAt: Timestamp | null;

  // --- Timestamps ---
  createdAt: Timestamp;
}
```

### Key Queries on `quotes`

| Query | Purpose |
|-------|---------|
| `where(tradieId, ==, X) && where(serviceRequestId, ==, Y)` | Has this tradie unlocked this request? |
| `where(serviceRequestId, ==, X) && where(status, 'in', ['quoted','accepted','rejected'])` | All actual quotes for intelligence calculation |
| `where(serviceRequestId, ==, X)` | All interactions (unlocks + quotes) — total interest |
| `where(tradieId, ==, X) && where(status, ==, 'quoted')` | Tradie's quote history |
| `where(serviceRequestId, ==, X) && where(status, ==, 'accepted')` | Who won this job? |

---

## `walletTransactions` Collection Schema (Flat)

```typescript
interface WalletTransactionDocument {
  id: string;
  userId: string;
  type: 'recharge' | 'unlock' | 'bonus' | 'refund';
  amount: number;                     // positive = credit, negative = debit
  description: string;
  referenceId: string;                // serviceRequestId or payment ID
  status: 'completed' | 'pending' | 'failed';
  createdAt: Timestamp;
}
```

This remains the financial audit trail. Every unlock creates both a `quotes` doc (lifecycle) AND a `walletTransactions` doc (money trail).

---

## Firestore Limitations & Constraints

### Key Constraints

| Constraint | Impact |
|-----------|--------|
| One `array-contains-any` per query | Can't filter by trades AND another array field |
| `in` / `array-contains-any` max 30 values | Batch if 30+ trade filters |
| Inequality filters require matching `orderBy` | `budgetMax >= X` forces `orderBy('budgetMax')` first |
| Multiple inequalities on different fields | Needs composite index per combination |
| No OR across different fields | Can't do in single query |

### Why Flat Fields

- `FieldValue.increment()` works directly on `intel_totalUnlocks`
- Simple `where('intel_competitionLevel', '==', 'low')` queries
- No dot-notation update headaches
- Easier composite index definitions

### Our Hybrid Strategy

**Server-side (always):**
- `where('status', '==', 'new')` + `orderBy('createdAt', 'desc')` + pagination
- Optionally ONE of: `array-contains-any(tradesLower)` OR `where('postcode', '==', X)`

**Client-side (after fetch):**
- Urgency, budget range, posted-within
- All intelligence filters
- All sort options except "Newest"

---

## How Filters Map to Fields

### Server-Side (Firestore WHERE)

| Filter | Field | Query |
|--------|-------|-------|
| Status | `status` | `== 'new'` |
| Trade type | `tradesLower` | `array-contains-any` |
| Postcode | `postcode` | `== value` |

### Client-Side (Post-Fetch)

| Filter | Field | Logic |
|--------|-------|-------|
| Urgency | `urgency` | includes check |
| Budget range | `budgetMax` | >= min and <= max |
| Posted within | `createdAt` | >= (now - hours) |
| Competition level | `intel_competitionLevel` | exact match |
| Opportunity score | `intel_opportunityScore` | range (min-max) |
| Win rate | `intel_winProbability` | >= threshold |
| Price gap | `intel_priceGapCategory` | exact match |

### Sort Options

| Sort | Where | Why |
|------|-------|-----|
| Newest | Firestore | Supports cursor pagination |
| Best Opportunity | Client | Can't combine orderBy with other constraints |
| Closest | Client | Distance calculated per-tradie |
| Highest Budget | Client | Would need different orderBy |

---

## Composite Indexes Needed

| Collection | Fields | Purpose |
|-----------|--------|---------|
| `serviceRequests` | `status` ASC, `createdAt` DESC | Explorer primary |
| `serviceRequests` | `status` ASC, `tradesLower` ARRAY, `createdAt` DESC | Explorer + trade filter |
| `serviceRequests` | `customerId` ASC, `status` ASC, `createdAt` DESC | Customer dashboard |
| `quotes` | `serviceRequestId` ASC, `status` ASC | Quotes for a request |
| `quotes` | `tradieId` ASC, `serviceRequestId` ASC | Unlock check |
| `quotes` | `tradieId` ASC, `status` ASC, `createdAt` DESC | Tradie history |
| `walletTransactions` | `userId` ASC, `createdAt` DESC | Wallet history |

---

## Cloud Functions Needed

| Function | Type | Trigger/Action |
|----------|------|----------------|
| `onServiceRequestCreated` | Firestore trigger | Initialize `intel_*` defaults + `tradesLower` |
| `unlockServiceRequest` | Callable | Validate, deduct wallet, create `quotes` doc (status: unlocked), create `walletTransactions`, increment `intel_totalUnlocks` on request |
| `submitQuote` | Callable | Validate unlock exists, update `quotes` doc (status: quoted, add pricing), recalculate ALL `intel_*` on request, notify customer |
| `acceptQuote` | Callable | Update winning quote (status: accepted), reject others, update request status, share contact, notify |

---

## Summary: What Happens at Each Action

### Customer Posts Request
```
FE: Upload files → Write to serviceRequests (status: 'new')
BE trigger: Set intel_* defaults, compute tradesLower
```

### Tradie Unlocks Request
```
FE: Call unlockServiceRequest callable
BE callable:
  1. Validate balance >= $0.50
  2. Deduct $0.50 from user.walletBalance
  3. Create quotes/{id} with status: 'unlocked'
  4. Create walletTransactions/{id} (type: 'unlock', amount: -0.50)
  5. Update serviceRequest: intel_totalUnlocks++, adjust intel_demandLevel
  6. Return success
```

### Tradie Submits Quote
```
FE: Call submitQuote callable
BE callable:
  1. Find existing quotes doc (tradieId + serviceRequestId + status: 'unlocked')
  2. Update it: status → 'quoted', add totalPrice/materials/labor/timeline/notes
  3. Fetch all quotes for this request where status in ['quoted','accepted','rejected']
  4. Run recalculateIntelligence() → write intel_* fields to serviceRequest
  5. Create notification for customer
  6. Return success
```

### Customer Accepts Quote
```
FE: Call acceptQuote callable
BE callable:
  1. Update winning quote: status → 'accepted', acceptedAt
  2. Update all other quoted docs for same request: status → 'rejected'
  3. Update serviceRequest: status → 'assigned', share address/phone
  4. Notify accepted tradie + rejected tradies
```

---

## Migration Steps

| Step | What |
|------|------|
| 1 | Create/update Cloud Functions (trigger + callables) |
| 2 | Migrate existing `unlockTransactions` data into `quotes` collection |
| 3 | Flatten `intelligence` nested object to `intel_*` fields on serviceRequests |
| 4 | Flatten `budget: {min,max}` to `budgetMin`, `budgetMax` |
| 5 | Add `tradesLower` field to all existing serviceRequests |
| 6 | Run backfill script to compute intel_* from existing quotes |
| 7 | Update FE `explorerService.ts` to read flat fields |
| 8 | Update FE components to use new field names |
| 9 | Delete `unlockTransactions` collection (after migration verified) |
