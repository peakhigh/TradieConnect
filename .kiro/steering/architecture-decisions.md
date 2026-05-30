# Architecture Decisions

## 1. Market Intelligence — Compute on Quote Creation

**Problem:** Calculating market intelligence (price ranges, competition level, win probability) on every page load is expensive and slow.

**Decision:** Compute intelligence via Cloud Functions triggered on quote create/update/delete. Store results in `requestIntelligence` collection.

**Impact:**
- Page load: 11 Firestore reads instead of 220
- Performance: 100-200ms instead of 2-5 seconds
- Cost: $0.13 per 1M loads instead of $1.32 (90% reduction)

**Implementation:**
- Cloud Functions: `onQuoteCreated`, `onQuoteUpdated`, `onQuoteDeleted`
- Each trigger recalculates intelligence for the affected request
- Explorer reads from `requestIntelligence` — one simple read per request

## 2. Progressive Batch Infinite Scrolling

**Problem:** Pure infinite scroll causes mindless scrolling, high memory usage, and excessive Firestore reads.

**Decision:** Load in pages of 10, auto-scroll up to 50 items, then show a "Load More" button.

**Behavior:**
1. Screen opens → load 10 items
2. User scrolls → auto-load 10 more → repeat until 50 total
3. At 50 items → show "Load More Items" button, stop auto-loading
4. User taps button → reset batch counter → resume auto-loading next 50

**Technical details:**
- `pageSize = 10`
- `batchSize = 50`
- Track `itemsLoadedInCurrentBatch` counter
- `onEndReached` fires only if counter < 50

## 3. Sensitive Operations via Cloud Functions

**Decision:** All operations involving money or private data go through callable Cloud Functions, never direct Firestore writes from the client.

**Cloud Function operations:**
- `unlockServiceRequest` — deducts wallet, creates transaction
- `submitQuote` — validates unlock, creates quote + notification
- `acceptQuote` — updates statuses, shares customer details
- `rechargeWallet` — adds funds (payment processor integration point)
- `completeServiceRequest` — updates ratings, marks complete
- `sendPushNotification` — sends FCM message

**Why:** Firestore security rules can't enforce complex business logic (balance checks, multi-document transactions). Cloud Functions provide atomic operations with proper validation.

## 4. Configuration-Driven Design

**Decision:** The app is built to be reusable across marketplace verticals. Business logic is driven by `appConfig.ts` rather than hardcoded.

**Configurable via `appConfig.ts`:**
- Theme (light/dark colors)
- Feature flags (chat, voice messages, unlock system, etc.)
- Pricing (unlock cost, recharge minimum, payment methods)
- Roles (permissions, onboarding steps, navigation tabs)
- Notifications (types, channels, quiet hours)

**Why:** Allows forking this codebase for other marketplace types (cleaners, tutors, pet services) with minimal code changes.

## 5. Auth Strategy — Phone OTP

**Decision:** Phone-based OTP authentication via Firebase Auth. No email/password.

**Why:**
- Tradies are mobile-first users who prefer phone login
- Reduces friction (no password to remember)
- Phone number doubles as contact info
- Firebase handles OTP delivery and verification

**Web caveat:** Uses reCAPTCHA verifier for web platform. Mobile uses native Firebase phone auth.

## 6. UI Filter Pattern — Drawer from Right

**Decision:** Filters slide in from the right as a drawer overlay, not inline panels.

**Why:**
- Preserves screen real estate on mobile
- Consistent pattern across Explorer and Dashboard
- Allows complex filter UIs without disrupting content layout
- Scroll-to-top button appears after 500px scroll
