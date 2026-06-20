# Customer Module — Completion Task List

Derived from a code scan (June 2026). This is the work needed to finish the **customer** experience end-to-end across iOS, Android, and Web.

Legend: `[ ]` todo · `[~]` exists but incomplete/stubbed · `[x]` done

> Cross-cutting rules apply (see `tasks-app-common.md`): right-slide drawers, cross-platform `Modal` confirmations, Gluestack + NativeWind, callable Cloud Functions for sensitive ops.

---

## Current State (scan summary)

| Area | File | State |
|------|------|-------|
| Dashboard | `customer/CustomerDashboard.tsx` (623) | `[~]` Renders requests + paginates, but **Accept Quote** and **Chat with Tradie** are `coming soon` stubs; "Recent Quotes" reads from `UserContext.quotes` which is **hardcoded empty** |
| Post Request | `customer/PostRequestScreen.tsx` (781) | `[~]` Full multi-field form, mock upload path wired; verify edit flow + voice/photo on all platforms |
| History | `customer/CustomerHistoryScreen.tsx` (203) | `[~]` Reads completed/cancelled; no detail view, no rating display source |
| Profile | `customer/CustomerProfileScreen.tsx` (268) | `[~]` Edit name/email + logout works; no address book, no notification prefs, no delete account |
| Messages (new) | `chat/ChatListScreen.tsx` + `chat/ChatScreen.tsx` | `[~]` Real Firestore chat works (text/image/doc); no filters, no read-sync via context |
| Messages (old) | `customer/MessagesScreen.tsx` (356) | `[~]` **Duplicate/legacy** messaging screen — decide: delete or merge |
| Interests | `customer/InterestsScreen.tsx` (305) | `[~]` Verify it lists tradies/quotes per request correctly |
| Request detail | — | `[ ]` No dedicated RequestDetailScreen; details shown via `RequestDetailsDrawer` only |
| Quote accept/decline | `components/chat/QuoteCard.tsx` | `[~]` Accept calls `acceptQuote` but passes **empty address/phone**; decline is a `TODO` no-op |
| UserContext data | `context/UserContext.tsx` | `[~]` **quotes/messages/unreadMessageCount hardcoded empty** — must wire to Firestore |

---

## 1. Data Layer (blocking — fixes many screens)

- [ ] `UserContext`: replace mock empty `quotes` with a real subscription — quotes across the customer's requests (collectionGroup or per-request), mapped to `Quote` type.
- [ ] `UserContext`: wire `unreadMessageCount` to real unread (sum `unreadByCustomer` across `chatRooms` or notifications of type `chat_message`).
- [ ] `UserContext`: remove the "Mock data for quotes and messages" block; document the new sources.
- [ ] Confirm `Quote` shape used by dashboard (`quote.tradie.firstName`, `quote.amount`, `estimatedStartDate` as Date) matches Firestore quote docs (`totalPrice`, `tradieName`, Timestamps) — add a mapper.

## 2. Quote Acceptance & Decline (core marketplace flow)

- [x] `QuoteCard` accept: collects real job address + phone (phone prefilled from profile) and passes them to `acceptQuote` instead of empty strings.
- [x] Implement **decline** quote: added `declineQuote` Cloud Function (set quote `rejected`, system message, notify tradie) and wired `QuoteCard` decline to it.
- [x] `QuoteCard` confirmations: replaced `useAlert` with the cross-platform `Modal` pattern (accept + decline modals).
- [x] CustomerDashboard "Recent Quotes": renders real quotes; routes **View Quotes** → Interests and **Chat with Tradie** → the request's chat (removed `coming soon`).
- [x] After accept: customer dashboard now surfaces assigned jobs in an **Active Jobs** section.

## 3. Request Detail & Lifecycle

- [ ] `RequestDetailScreen` (or upgrade `RequestDetailsDrawer`): full request info + quotes list with per-quote accept/decline + status actions.
- [x] **Complete job** flow: `CompleteJobModal` calls `completeServiceRequest`; rating form (1–5 + review) via cross-platform modal; surfaced from dashboard Active Jobs.
- [x] **Cancel request** flow: guarded cross-platform confirm in dashboard.
- [x] Rating submission writes rating + updates tradie aggregate (`completeServiceRequest` handles `ratings`/tradie rating).
- [ ] History: tap a card → read-only `RequestDetailScreen`; ensure `rating`/`finalPrice` are surfaced in History.

## 4. Messaging (consolidate)

- [ ] Decide between `chat/ChatListScreen`+`ChatScreen` (keep) and `customer/MessagesScreen` (legacy) — **remove the duplicate** or merge useful bits.
- [ ] Chat list: add filters (quote status, unread-only, trade/suburb) via right-slide `FilterDrawer` (see `chat-plan.md`).
- [ ] Chat: render image messages as actual thumbnails (currently shows "📷 Photo attached" text) using `ImageViewer`.
- [ ] Mark-as-read: drive unread badge from context so dashboard + nav reflect it live.

## 5. Profile & Settings

- [ ] Address book (saved addresses) for fast request posting + supplying on accept.
- [ ] Notification preferences (chat/quotes toggles) → `users.notificationPrefs`.
- [ ] Delete account flow (calls a Cloud Function to clean up data) with cross-platform confirm.
- [ ] Wire the blank `Notifications`, `Settings`, `Help` placeholder screens (in `CustomerTabs`) or remove from nav until built.

## 6. Post Request polish

- [ ] Verify multi-step UX + validation on web + native; confirm edit (`editRequestId`) prefills correctly.
- [ ] Photo/voice capture verified on iOS, Android, Web (mock path via `EXPO_PUBLIC_USE_MOCKS`).
- [ ] Ensure created request gets `intel_*` defaults + `tradesLower` + `searchKeywords` (backend `onServiceRequestCreated`).

## 7. Notifications (customer-facing)

- [ ] In-app notifications feed screen + unread badge (shared with tradie; see `notifications-plan.md`).
- [ ] Tapping a `new_quote` / `quote_accepted` notification deep-links to the request/chat.

## 8. QA / Definition of Done (customer)

- [ ] Seeded data renders every customer screen (see `mock-data-and-scripts.md`).
- [ ] Full flow works: post → receive quote → chat → accept → complete → rate.
- [ ] All confirmations use cross-platform modal; drawers slide right.
- [ ] Verified on iOS, Android, Web.
