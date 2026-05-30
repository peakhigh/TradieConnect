# Data Model & Firestore Collections

## Collections

### `users`
User profiles for all roles.

| Field | Type | Notes |
|-------|------|-------|
| id | string | Firebase Auth UID |
| userType | `'customer' \| 'tradie' \| 'admin'` | Role |
| displayName | string | |
| phone | string | Used for OTP auth |
| email | string | Optional |
| walletBalance | number | Tradie only, in AUD |
| rating | number | Tradie only, 0-5 |
| totalJobs | number | Tradie only |
| onboardingCompleted | boolean | Tradie only |
| trades | string[] | Tradie only |
| suburbs | string[] | Tradie only |
| fcmToken | string | For push notifications |
| createdAt | Timestamp | |

### `serviceRequests`
Customer job postings.

| Field | Type | Notes |
|-------|------|-------|
| id | string | Auto-generated |
| customerId | string | Ref to users |
| trades | string[] | e.g. ['Plumbing'] |
| suburb | string | |
| description | string | |
| photos | string[] | Storage URLs |
| voiceMessage | string | Storage URL, optional |
| status | `'active' \| 'in-progress' \| 'completed' \| 'cancelled'` | |
| acceptedQuoteId | string | Set when quote accepted |
| customerAddress | string | Shared after acceptance |
| customerPhone | string | Shared after acceptance |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

### `quotes`
Tradie submissions for service requests.

| Field | Type | Notes |
|-------|------|-------|
| id | string | Auto-generated |
| serviceRequestId | string | Ref to serviceRequests |
| tradieId | string | Ref to users |
| amount / totalPrice | number | Total quote price |
| materialsCost | number | Breakdown |
| laborCost | number | Breakdown |
| timelineDays | number | Estimated duration |
| estimatedStartDate | Timestamp | |
| estimatedCompletionDate | Timestamp | |
| notes | string | |
| status | `'pending' \| 'accepted' \| 'rejected'` | |
| createdAt | Timestamp | |
| acceptedAt | Timestamp | Optional |

### `requestIntelligence`
Pre-computed market data per request. Updated by Cloud Functions on quote changes.

| Field | Type | Notes |
|-------|------|-------|
| requestId | string | Doc ID = serviceRequest ID |
| totalQuotes | number | |
| priceRange | `{ min, max, average }` | |
| timelineRange | `{ minDays, maxDays, averageDays }` | |
| breakdown | `{ materials: {...}, labor: {...} }` | |
| competitionLevel | `'low' \| 'medium' \| 'high'` | |
| opportunityScore | number | 0-100 |
| winProbability | number | 0-1 |
| recommendedPriceRange | `{ min, max, optimal }` | |
| marketTrends | `{ priceDirection, demandLevel }` | |
| updatedAt | Timestamp | |

### `unlockTransactions`
Records of tradies unlocking requests.

| Field | Type | Notes |
|-------|------|-------|
| tradieId | string | |
| serviceRequestId | string | |
| amount | number | Always 0.50 |
| status | `'completed'` | |
| timestamp | Timestamp | |

### `walletTransactions`
All wallet movements (recharges, unlocks, bonuses).

| Field | Type | Notes |
|-------|------|-------|
| userId | string | |
| type | `'recharge' \| 'unlock' \| 'bonus'` | |
| amount | number | Positive = credit, negative = debit |
| description | string | |
| status | `'completed'` | |
| timestamp | Timestamp | |

### `notifications`
In-app and push notification records.

| Field | Type | Notes |
|-------|------|-------|
| userId | string | Recipient |
| title | string | |
| message | string | |
| type | string | e.g. 'quote', 'quote_accepted' |
| read | boolean | |
| timestamp | Timestamp | |

## Indexing Strategy

Firestore queries that need composite indexes:
- `quotes` → `requestId` + `status`
- `serviceRequests` → `status` + `createdAt` (for Explorer)
- `unlockTransactions` → `tradieId` + `serviceRequestId` + `status`
- `walletTransactions` → `userId` + `timestamp`
