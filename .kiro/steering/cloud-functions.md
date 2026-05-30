# Cloud Functions Guide

## Overview

Cloud Functions live in `/functions/src/` and handle all sensitive business logic. They are callable functions invoked from the client via `httpsCallable`.

## Deployed Functions

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `unlockServiceRequest` | Deduct $0.50, record transaction | Yes (tradie) |
| `submitQuote` | Create quote, notify customer | Yes (tradie) |
| `acceptQuote` | Accept quote, share customer details | Yes (customer) |
| `rechargeWallet` | Add funds to tradie wallet | Yes |
| `completeServiceRequest` | Mark done, update ratings | Yes (customer) |
| `sendPushNotification` | Send FCM push to user | Yes |

## Calling from Client

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

const unlock = httpsCallable(functions, 'unlockServiceRequest');
const result = await unlock({ serviceRequestId: 'abc123' });
```

## Error Handling Pattern

Functions throw `HttpsError` with codes:
- `unauthenticated` — no auth token
- `permission-denied` — wrong role or unauthorized
- `not-found` — resource doesn't exist
- `failed-precondition` — insufficient balance, inactive request, etc.
- `internal` — unexpected server error

Client should catch and display user-friendly messages based on error code.

## Module Structure

```
/functions/src/
  index.ts              → All exported functions
  /modules/
    /auth/              → Auth-related functions
    /chat/              → Messaging functions
    /notifications/     → Push notification logic
    /payments/          → Wallet and transaction logic
```

## Development & Deployment

```bash
cd functions
npm install
npm run build          # Compile TypeScript
npm run serve          # Local emulator
npm run deploy         # Deploy to Firebase
```

Or from project root:
```bash
npm run deploy:functions
```

## Intelligence Update Pattern

When implementing quote-triggered intelligence updates, follow this pattern:

```typescript
// Trigger: onQuoteCreated / onQuoteUpdated / onQuoteDeleted
// 1. Get all quotes for the affected requestId
// 2. Recalculate intelligence (price ranges, competition, etc.)
// 3. Write to requestIntelligence/{requestId}
```

The `calculateIntelligence()` helper in `index.ts` handles the math. It computes:
- Price range (min, max, average)
- Timeline range
- Materials/labor breakdown
- Competition level
- Opportunity score
- Win probability
- Recommended price range
- Market trends
