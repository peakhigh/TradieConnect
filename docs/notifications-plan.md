# Notifications & Push — Implementation Plan

Goal: full push-notification lifecycle on **iOS, Android, and Web** — request permission, obtain and store the device token, send pushes from the backend, and keep an in-app notification feed with unread badges. Everything needed already exists in BuildOn; this plan maps those blocks onto TradieConnect.

---

## What We Reuse From BuildOn

| BuildOn source | Responsibility | TradieConnect target |
|----------------|----------------|----------------------|
| `frontend/common/hooks/useMobileNotifications.js` | Native permission + FCM token + foreground/opened handlers | `app/hooks/useMobileNotifications.ts` (exists — verify token field name) |
| `frontend/components/notifications/NotificationsProvider.js` | Subscribes to `notifications`, computes `unReadCount`, `unReadMessagesCount`, `unReadRoomsWithMessages` | `app/context/NotificationsContext.tsx` (new) |
| `frontend/components/notifications/useNotificationsContext.js` | Hook accessor | folded into the context file |
| `frontend/components/notifications/NotificationsBadge.js` | Red count badge for nav | `app/components/UI/NotificationsBadge.tsx` (new) |
| `frontend/components/notifications/UnreadMessagesBadge.js` + `BellBadge.js` | Unread-message dot | `app/components/UI/MessageNotification.tsx` (exists) |
| `frontend/components/notifications/NotificationItem.js` / `Notifications.js` | Notification list + item rows | `app/screens/NotificationsScreen.tsx` + `NotificationItem.tsx` (new) |
| `backend/notifications.js` → `sendPushNotification`, `addNotificationRecord` (dedup) | Push send + dedup pattern | `functions/src/modules/notifications/sendPush.ts` (exists — add dedup) |

---

## ⚠️ Field-Name Alignment (do this first)

There are two inconsistencies to reconcile across the codebase, because BuildOn and the current TradieConnect code disagree:

| Concept | BuildOn | TradieConnect (current) | Decision |
|--------|---------|--------------------------|----------|
| Device token field on `users` | `pushToken` | `fcmToken` (used in `useMobileNotifications.ts`, `sendPush.ts`, `onMessageCreated.ts`) | **Standardize on `fcmToken`** across TradieConnect. When copying BuildOn backend code, rename `pushToken` → `fcmToken`. |
| Read flag on `notifications` | `isRead` | `read` (used in `sendPush.ts`, `onMessageCreated.ts`, indexes) | **Standardize on `read`**. When copying BuildOn provider/list code, rename `isRead` → `read`. |
| Notification "navigate to" key | `goto` + `itemId` + `subItemIds` | `referenceId` | Adopt BuildOn's richer shape: add `goto`, `itemId`, keep `referenceId` as alias during migration. |

Documenting this now prevents silent "push never arrives / badge never clears" bugs.

---

## `users` Token Fields

| Field | Type | Notes |
|-------|------|-------|
| `fcmToken` | string \| null | Current device token (native). Updated on login + `onTokenRefresh`. |
| `webPushToken` | string \| null | Optional — web FCM token (requires VAPID key + service worker). Phase 2. |
| `notificationPrefs` | object | `{ chat: bool, quotes: bool, marketing: bool }` — drives whether backend sends. |

---

## `notifications` Document Schema

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto |
| `userId` | string | Recipient |
| `title` | string | |
| `message` / `body` | string | Keep one; BuildOn uses `body`. Standardize on `message`. |
| `type` | string | `'chat_message' \| 'new_quote' \| 'quote_accepted' \| 'quote_rejected' \| 'job_completed' \| 'wallet'` |
| `itemId` | string | The entity to open (roomId, requestId, quoteId) |
| `goto` | string | Target screen key (`'chatscreen'`, `'requestDetail'`, `'wallet'`) |
| `read` | boolean | |
| `createdAt` | Timestamp | |

---

## Permission + Token Lifecycle (native)

Implemented in `useMobileNotifications.ts` (already present). Confirmed behavior:

1. Skip entirely on web (`isWeb()` guard).
2. Dynamically import `@react-native-firebase/messaging` (only available in dev/native builds, not Expo Go).
3. `requestPermission()` → if denied, stop.
4. `getToken()` → save to `users/{uid}.fcmToken` via `useSave`.
5. `onTokenRefresh` → update token.
6. `onMessage` (foreground) → trigger in-app refresh / toast.
7. `onNotificationOpenedApp` → deep-link using `data.goto` + `data.itemId`.
8. Re-fetch notifications on `AppState` → `active`.

**Action item:** wire `useMobileNotifications` into the app root (e.g. inside `NotificationsContext` provider or `AppNavigator`) so it actually runs after login. It currently exists but must be invoked once for an authenticated user.

### Web push (Phase 2, optional)
- Requires `firebase/messaging` web SDK, a VAPID key, and a `firebase-messaging-sw.js` service worker in the hosting `dist/`.
- `getToken({ vapidKey })` → store as `webPushToken`.
- Until then, web relies on the **real-time in-app feed** (Firestore `subscribe`) + toast, which BuildOn's provider already does for web.

---

## In-App Feed: NotificationsContext

Port BuildOn's `NotificationsProvider`:

- Query `notifications` where `userId == uid` (and `read == false` in "unread" mode), limit 50/100.
- `subscribe: Platform.OS === 'web'` — web gets real-time; mobile pulls on focus/foreground (push covers the live case).
- Compute and expose: `unReadCount`, `unReadMessagesCount`, `unReadRoomsWithMessages`, `markAsRead(id)` (optimistic), `refreshNotifications`, `mode`, `setMode`.
- Optimistic `markAsRead` via a local `Set` of ids, reset when fresh data arrives.

Wrap in `App.tsx` alongside `AuthProvider` / `UserProvider`.

---

## Backend: Sending Pushes

Two existing entry points:

1. **`onChatMessageCreated`** (Firestore trigger) — already sends chat push + creates in-app notification. Add `lastMessageType` and dedup.
2. **`sendPushNotification`** (callable) — generic send. Used by `submitQuote`, `acceptQuote`, `complete`.

### Dedup pattern (port from BuildOn `addNotificationRecord`)
Before creating an unread in-app notification, check if one already exists for the same `userId + type + itemId` that is still unread. If so, skip (prevents the feed filling with "New message" rows for the same room). Pseudocode:

```
exists = notifications
  .where(userId == X).where(type == T).where(itemId == I).where(read == false)
  .limit(1)
If not exists → add new notification
```

Requires composite index: `notifications` → `userId` + `type` + `itemId` + `read`.

### Token-invalid handling
`admin.messaging().send()` can throw `messaging/registration-token-not-registered`. Wrap in try/catch (already done in `onMessageCreated`); on that specific error, clear `users/{uid}.fcmToken` so we stop trying.

---

## Notification → Screen Routing

| `type` | `goto` | Opens |
|--------|--------|-------|
| `chat_message` | `chatscreen` | `ChatScreen` with `itemId` as roomId |
| `new_quote` | `requestDetail` | Customer request detail (quotes list) |
| `quote_accepted` / `quote_rejected` | `chatscreen` | The relevant chat room |
| `job_completed` | `requestDetail` | Completed request |
| `wallet` | `wallet` | `WalletScreen` |

Handle both cold-start (`getInitialNotification`) and warm (`onNotificationOpenedApp`).

---

## Indexes

| Collection | Fields | Purpose |
|-----------|--------|---------|
| `notifications` | `userId` + `read` + `createdAt` DESC | Unread feed (exists) |
| `notifications` | `userId` + `createdAt` DESC | Latest feed (exists) |
| `notifications` | `userId` + `type` + `itemId` + `read` | Dedup lookup (add) |

---

## Build Order

1. Reconcile field names (`fcmToken`, `read`, add `goto`/`itemId`).
2. Invoke `useMobileNotifications` after login; verify token lands in Firestore.
3. Port `NotificationsContext` + wrap app; show real-time toast on web.
4. Add `NotificationsBadge` + wire unread counts into nav tabs/sidebar.
5. Add dedup to backend notification creation + index.
6. `NotificationsScreen` list + mark-as-read.
7. Deep-link routing from tapped push.
8. (Phase 2) Web push via VAPID + service worker.
