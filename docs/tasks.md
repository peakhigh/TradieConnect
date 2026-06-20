# Build Tasks — Customer & Tradie Modules (Full Functionality)

A complete, ordered task list to finish both modules with all functionality discussed: chat (room-per-quote), notifications/push, root-level intelligence, tradie reporting/insights, contacts list, and mock-data tooling.

Legend: `[ ]` todo · `[~]` partial/exists-needs-work · `[x]` done

Related design docs: `chat-plan.md`, `notifications-plan.md`, `tradie-reporting.md`, `mock-data-and-scripts.md`, `intelligence-algorithm.md`.

---

## 0. Foundations & Alignment

- [ ] Reconcile field names project-wide: device token = `fcmToken`, notification read flag = `read`, add `goto` + `itemId` to notifications (see `notifications-plan.md`).
- [ ] Confirm intelligence lives as flat `intel_*` on `serviceRequests` (root level); remove/deprecate references to a separate `requestIntelligence` collection in code + `data-model.md` + `index.html`.
- [ ] Add chat config flag to `appConfig.ts`: `chat.openRoomOn = 'quote' | 'accept'` (default `'quote'`).
- [ ] Define/refresh TS types: `app/types/index.ts` (ChatRoom, ChatMessage), `app/types/reporting.ts`.

---

## 1. Chat — Room Per Quote

### Backend
- [~] `submitQuote`: create `chatRoom` + first `quote` message + system message; set `quoteStatus: 'pending'`, `participants`.
- [~] `acceptQuote`: set room `quoteStatus`; add system message; mark other quotes rejected + their rooms.
- [x] `onChatMessageCreated`: maintain `lastMessage`, unread counts, push + in-app notification.
- [ ] Extend `onChatMessageCreated`: set `lastMessageType`; add notification dedup (`userId+type+itemId+read`).
- [ ] Add chat indexes (`participants`+`lastMessageAt`, `participants`+`quoteStatus`+`lastMessageAt`).

### Services / Hooks
- [ ] `app/services/chatService.ts` — create room, send message (text/image/document), mark room read, field mapping (`senderId/Name` ↔ `user.id/name`).
- [ ] `app/hooks/useChatRooms.ts` — subscribe to rooms for current user.
- [ ] `app/hooks/useChatMessages.ts` — paginated message subscription per room.

### Components (port from BuildOn)
- [ ] `ChatView.tsx` — FlatList, scroll-anchoring, load-previous, render-by-type.
- [ ] `MessageBubble.tsx` — text/image/document, avatar, time grouping.
- [ ] `SystemMessage.tsx` — centered event pill / styled card.
- [~] `QuoteCard.tsx` — exists; switch confirmations to cross-platform `Modal` (no `Alert.alert`); wire into `ChatView` for `type:'quote'`.
- [ ] `ChatComposer.tsx` — text input + send + attachment trigger.
- [~] `AttachmentMenu.tsx` — exists; finalize camera/gallery/document + upload.
- [ ] `ChatActionButtons.tsx` — role + `quoteStatus` aware (Accept / Not Interested / Reopen) with modals.
- [ ] `ChatFilterBar.tsx` — All / Messages / Quote (adapt BuildOn).

### Screens
- [~] `ChatScreen.tsx` — compose Header + ChatFilterBar + ChatView + ChatActionButtons + ChatComposer.
- [ ] Image/document viewing via reused `ImageViewer`/`PhotoModal`.

---

## 2. Contacts / Chat List Screen

- [ ] `app/screens/chat/ContactsListScreen.tsx` — list of `chatRooms` (`participants array-contains uid`, `orderBy lastMessageAt desc`). Render "via quotes" → tap → ChatScreen.
- [ ] `app/components/chat/ChatRoomCard.tsx` — name, trade+suburb, last-message preview (with type icon), timestamp, unread dot/count, quote-status badge.
- [ ] Filters in right-slide `FilterDrawer`: quote status (All/Pending/Accepted/Declined), unread-only, trade, suburb, name search.
- [ ] Sort: Latest / Oldest / Name A–Z.
- [ ] Wire Messages tab (CustomerTabs + TradieTabs) → `ContactsListScreen`.
- [ ] Empty/loading states (`EmptyState`, `SkeletonLoader`).

---

## 3. Notifications & Push

- [~] `useMobileNotifications.ts` — exists; **invoke after login** so token is saved; verify `fcmToken` lands in Firestore.
- [ ] `app/context/NotificationsContext.tsx` — port BuildOn provider (unread counts, message rooms, optimistic markAsRead, web subscribe). Wrap in `App.tsx`.
- [ ] `app/components/UI/NotificationsBadge.tsx` — red count badge for nav.
- [~] `MessageNotification.tsx` — unread-message dot (exists; connect to context).
- [ ] `app/screens/NotificationsScreen.tsx` + `NotificationItem.tsx` — feed, mark read, mode (unread/latest).
- [ ] Backend: notification dedup + clear invalid `fcmToken` on `registration-token-not-registered`.
- [ ] Deep-link routing from tapped push (`goto` + `itemId`) — cold start + warm.
- [ ] Add dedup index (`userId+type+itemId+read`).
- [ ] (Phase 2) Web push: VAPID key + `firebase-messaging-sw.js` + `webPushToken`.

---

## 4. Root-Level Intelligence (serviceRequests)

- [x] `onServiceRequestCreated` initializes `intel_*` + `tradesLower`.
- [~] `unlock` / `submitQuote` / `acceptQuote` recalc `intel_*` (verify all fields per `intelligence-algorithm.md`).
- [ ] Migration: flatten any legacy nested `intelligence`/`budget` objects; backfill `intel_*` + `tradesLower` + `searchKeywords` on existing requests.
- [ ] Update `explorerService.ts` + Explorer components to read flat fields only.
- [ ] Remove `requestIntelligence` collection usage after verification.

---

## 5. Tradie Reporting & Insights

### Data model + backend
- [ ] Types: `app/types/reporting.ts` + `functions/src/types`.
- [ ] `functions/src/modules/reporting/rollups.ts` — increment helpers for `suburbTradeStats`/`suburbStats`/`tradeStats`.
- [ ] Hook rollup updates into `onServiceRequestCreated`, `unlock`, `submitQuote`, `acceptQuote`, `complete`.
- [ ] Callables: `getMySuburbReport`, `getNearbySuburbReport`, `getSuburbDetail`, `rankSuburbs`, `rankTrades`.
- [ ] Nightly scheduled reconciliation function.
- [ ] Reporting indexes (see `tradie-reporting.md` §8).
- [ ] `suburbAdjacency` build script + collection.

### Frontend
- [ ] `useReport` hook (wraps `runCloudFunction`).
- [ ] Chart wrappers: `TrendChart`, `BarComparison`, `DonutShare` (validate `react-native-gifted-charts` on web first).
- [ ] `ReportFilters` (right drawer), `MetricToggle`, `SuburbStatRow`.
- [ ] `InsightsScreen` — My Market overview + highlight cards (best opportunity / low-competition-high-money).
- [ ] `SuburbRankingsScreen` — ranked, sortable, filterable.
- [ ] `SuburbDetailScreen` — single suburb deep dive + per-trade table + charts.
- [ ] `TradeOpportunityScreen` — trades not offered, ranked by opportunity.
- [ ] Add Insights to `TradieTabs` + web route in `AppNavigator`.

---

## 6. Customer Module Completion

- [~] CustomerDashboard — stats + active requests (verify against seeded data).
- [~] PostRequestScreen — multi-step; wire mock uploads via `EXPO_PUBLIC_USE_MOCKS`.
- [ ] RequestDetailScreen — quotes list, accept/decline, status actions, rating form on complete.
- [~] CustomerHistoryScreen — filters + read-only detail.
- [ ] Messages → `ContactsListScreen` + ChatScreen (shared).
- [~] CustomerProfileScreen — personal info, address book, notification prefs.
- [ ] `completeServiceRequest` + rating flow end-to-end (cross-platform modal).
- [ ] Cancel request flow (cross-platform confirm modal).

---

## 7. Tradie Module Completion

- [~] TradieDashboard — wallet balance, stats, recent activity.
- [~] Explorer — locked/unlocked cards, intelligence, progressive batch scroll, right filter drawer.
- [~] SubmitQuoteScreen — intelligence panel + submit.
- [~] WalletScreen — balance, recharge, transaction history.
- [~] TradieHistoryScreen — quotes + completed jobs tabs.
- [ ] Insights/reporting screens (section 5).
- [ ] Messages → shared chat.
- [~] Onboarding steps — verify $10 bonus credit + `onboardingCompleted`.

---

## 8. Mock Data, Seeding & Cleanup

- [ ] `scripts/seed/seedUsers.js`
- [ ] `scripts/seed/seedRequestsAndQuotes.js` (lifecycle + `intel_*` + 90-day date spread)
- [ ] `scripts/seed/seedChat.js`
- [ ] `scripts/seed/seedNotifications.js`
- [ ] `scripts/seed/seedAll.js` (orchestrator)
- [ ] `scripts/backfillReportingRollups.js`
- [ ] `scripts/clean/cleanAll.js` + `cleanCollection.js` (tag `seed:true`, project allowlist + `--yes` guardrail)
- [ ] npm scripts: `seed:all`, `seed:reset`, `seed:rollups`, `seed:adjacency`, `clean:all`
- [ ] Mock file-upload path behind `EXPO_PUBLIC_USE_MOCKS`
- [ ] Full render/QA pass across all roles on web + native; verify empty states after cleanup.

---

## 9. Cross-Cutting / Done-Definition

- [ ] Every new UI: Gluestack + NativeWind + Styled Components, responsive, no new UI libs (charts are the one documented exception).
- [ ] Drawers slide from right; dropdowns open beneath trigger; confirmations use cross-platform `Modal` (no `Alert.alert` / `window.confirm`).
- [ ] All Firebase calls wrapped in try/catch + Toast; loading + error + empty states.
- [ ] Sensitive ops (money, contact sharing, quote lifecycle) via callable Cloud Functions only.
- [ ] Verified on iOS, Android, and Web.
- [ ] Deploy: indexes (`deploy:indexes`), rules (`deploy:rules`), functions (`deploy:functions`).
