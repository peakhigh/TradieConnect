# App-Common — Completion Task List

Shared infrastructure, services, navigation, backend, and cross-cutting concerns that both the customer and tradie modules depend on. Derived from a code scan (June 2026).

Legend: `[ ]` todo · `[~]` exists but incomplete/stubbed · `[x]` done

---

## Current State (scan summary)

| Area | Where | State |
|------|-------|-------|
| App entry | `App.tsx` | `[x]` ErrorBoundary + Alert + Auth + User providers wired (no Notifications provider yet) |
| Navigation | `navigation/*` | `[~]` Custom web-sidebar + mobile-tabs working; `Notifications`/`Settings`/`Help` render **blank placeholders**; web `linking` config missing Messages/Chat/Wallet/Insights routes |
| Auth | `context/AuthContext.tsx`, `screens/auth/LoginScreen.tsx` (594) | `[~]` Phone OTP; `SignupScreen` is just a re-export of `LoginScreen` |
| User data | `context/UserContext.tsx` | `[~]` **quotes/messages/unread hardcoded empty** — see customer tasks |
| Cloud Functions | `functions/src/index.ts` (12) | `[~]` 8 functions exported; **no `declineQuote`, no `rateTradie`, no reporting, no token-based notifications dedup** |
| Notifications | `hooks/useMobileNotifications.ts`, `functions/.../sendPush.ts`, `onMessageCreated.ts` | `[~]` Hook exists but **not invoked after login**; no `NotificationsContext`; field-name mismatches |
| Intelligence | `functions/.../intelligence.ts`, `onCreate.ts` | `[~]` Flat `intel_*` implemented; verify all writers consistent; legacy `requestIntelligence` references remain |
| Explorer service | `services/explorerService.ts` + `optimizedExplorerService.ts` + `explorerServiceWithFallback.ts` (2 lines) | `[~]` Multiple variants — consolidate |
| Admin | `screens/admin/AdminDashboard.tsx` (308) | `[~]` **Almost entirely stubs** (`coming soon`), revenue/unlocks hardcoded 0 |
| Indexes | `firestore.indexes.json` | `[~]` Large; missing chat/reporting/dedup indexes |
| Scripts | `scripts/*` | `[~]` Seed/migrate scripts predate chat/notifications/reporting |

---

## 1. Data & Context

- [ ] Fix `UserContext` mock data (quotes/messages/unread) — wire to Firestore (also in customer tasks; it's shared infra).
- [ ] Add `NotificationsContext` (port BuildOn provider) and wrap in `App.tsx`; expose unread counts app-wide.
- [ ] Invoke `useMobileNotifications` after login so `fcmToken` is stored.
- [ ] Standardize field names: device token `fcmToken`, notification read flag `read`, add `goto`+`itemId` (see `notifications-plan.md`).

## 2. Navigation

- [ ] Build or remove the blank `Notifications`, `Settings`, `Help` placeholder screens in `CustomerTabs`/`TradieTabs`.
- [ ] Extend web `linking` config: Messages, Chat, Wallet, Insights, Interests, SubmitQuote routes.
- [ ] Add Insights route/tab for tradie.
- [ ] Consider a real `NotificationsScreen` shared by both roles.
- [ ] Verify deep-link routing from tapped push (`goto`+`itemId`) cold-start + warm.

## 3. Auth

- [ ] `SignupScreen` is a stub re-export of `LoginScreen` — implement a true signup/role flow or remove the separate route.
- [ ] Confirm role selection + new-user creation path; reCAPTCHA on web, native phone auth on mobile.
- [ ] Session persistence + `refreshUser()` verified across reloads (web localStorage).

## 4. Cloud Functions (backend completeness)

- [x] `onServiceRequestCreated`, `unlockServiceRequest`, `submitQuote`, `acceptQuote`, `rechargeWallet`, `completeServiceRequest`, `sendPushNotification`, `onChatMessageCreated`.
- [ ] `declineQuote` — customer declines a single quote (status `rejected`, system msg, notify).
- [ ] `rateTradie` — write `ratings`, update tradie aggregate (verify if `complete.ts` already does this; if so, expose/clean).
- [ ] Reporting: `rollups.ts` helpers + hook into request/quote functions + nightly `reconcileRollups` scheduled fn + read callables (see `tradie-reporting.md`).
- [ ] Notification dedup in `onChatMessageCreated` (skip if unread `userId+type+itemId` exists) + clear invalid `fcmToken` on send error.
- [ ] Admin callables: user management (suspend/verify), financial aggregates (revenue, unlocks).
- [ ] `deleteUserData` callable for account deletion (BuildOn has one).

## 5. Intelligence Cleanup

- [ ] Confirm `intel_*` written consistently by `onCreate`, `unlock`, `submitQuote`, `acceptQuote`, `complete`.
- [ ] Remove/migrate any legacy `requestIntelligence` collection usage; align `data-model.md` + `index.html`.
- [ ] Backfill `intel_*` + `tradesLower` + `searchKeywords` on existing requests (migration script).

## 6. Services Consolidation

- [ ] Consolidate `explorerService.ts` / `optimizedExplorerService.ts` / `explorerServiceWithFallback.ts` (stub, 2 lines) into one documented service.
- [ ] Add `chatService.ts` (create room, send message, mark read, field mapping) — currently chat logic is inline in screens.
- [ ] Add `reportingService.ts` / `useReport` hook.
- [ ] Ensure all Firebase calls go through try/catch + Toast + `parseFirebaseError`.

## 7. Admin Module (currently stubbed)

- [ ] Replace `coming soon` handlers with real screens: User Management, Accounts, Money/Transactions.
- [ ] Real revenue + unlock totals from `walletTransactions` (currently hardcoded 0).
- [ ] Tradie approval flow (`isApproved`).
- [ ] Reports (user/financial/performance) — wire to real aggregates or remove buttons.
- [ ] Recent activity monitoring.

## 8. Firestore Indexes & Rules

- [ ] Add chat indexes (`participants`+`lastMessageAt`, `participants`+`quoteStatus`+`lastMessageAt`).
- [ ] Add notification dedup index (`userId`+`type`+`itemId`+`read`).
- [ ] Add reporting indexes (see `tradie-reporting.md` §8).
- [ ] Review `firestore.rules` for new collections (`chatRooms`, `messages`, reporting rollups, `ratings`).
- [ ] Prune redundant/duplicate serviceRequests indexes (there are several near-duplicates).

## 9. Mock Data, Seeding & Cleanup (see `mock-data-and-scripts.md`)

- [ ] Seed scripts: users, requests+quotes (lifecycle + `intel_*` + 90-day spread), chat, notifications.
- [ ] Reporting rollup backfill + `suburbAdjacency` build scripts.
- [ ] Cleanup scripts (tag `seed:true`, project allowlist + `--yes` guardrail).
- [ ] npm scripts: `seed:all`, `seed:reset`, `seed:rollups`, `seed:adjacency`, `clean:all`.
- [ ] Mock file-upload path behind `EXPO_PUBLIC_USE_MOCKS` (FileUpload already supports it; wire into PostRequest + chat).

## 10. Cross-Cutting Standards (Definition of Done for every task)

- [ ] UI built with Gluestack UI + NativeWind + Styled Components, responsive, no new UI libs (charts = documented exception).
- [ ] Drawers slide from the right; dropdowns open beneath trigger.
- [ ] All OK/Cancel/destructive confirmations use the cross-platform `Modal` pattern — **no `Alert.alert` / `window.confirm`** (audit existing `showAlert` usages).
- [ ] Loading + error + empty states on every data view.
- [ ] Sensitive ops (money, contact sharing, quote lifecycle, ratings) via callable Cloud Functions only.
- [ ] Strict TypeScript types for props, docs, function payloads.
- [ ] Verified on iOS, Android, and Web.
- [ ] Deploy: `deploy:indexes`, `deploy:rules`, `deploy:functions`, `deploy:hosting`.

## 11. Cleanup / Tech Debt

- [ ] Remove legacy duplicates: `customer/MessagesScreen.tsx`, `tradie/ServiceRequestExplorer.tsx`, `explorerServiceWithFallback.ts`.
- [ ] Remove debug `console.log` in `AppNavigator` (auth state logs).
- [ ] Reconcile two theme files (`theme.ts` vs `theme.js`).
- [ ] Audit `(user as any)` casts — tighten `User`/`Customer`/`Tradie` types in `app/types`.
