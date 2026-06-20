# Chat & Messaging — Implementation Plan

## Concept

When a tradie **submits a quote**, a chat room is automatically created between that tradie and the customer. The quote is rendered as a special **quote card** message inside the chat. The customer can accept or decline directly from the chat. After that both parties communicate freely, share files/images, and coordinate the job.

> **Phase 1 policy:** open a chatroom for **every quote** (one room per quote). This keeps the model simple and lets customers talk to any tradie who quoted. Later we can tighten this to "only accepted/shortlisted tradies" with a single config flag (`appConfig.chat.openRoomOn = 'quote' | 'accept'`). Designing it as a flag now means no schema change later.

This plan follows the **BuildOn chat architecture** (`_buildon/frontend/components/chatscreen/`) and reuses as much of its proven message-type and card system as possible.

---

## How It Works (Flow)

```
1. Tradie submits quote → Cloud Function (submitQuote) creates chatRoom + first "quote" message + system message
2. Customer sees room in Messages/Contacts tab → opens chat → sees quote card
3. Customer acts on the quote card: Accept Quote / Not Interested
4. If accepted: request status → 'assigned', other quotes → rejected, contact details shared, system message added
5. Both parties chat freely — text, images, documents
6. Job completes → customer rates tradie → system message added
```

---

## Reuse Map — BuildOn → TradieConnect

BuildOn is the most mature reference. Map its chat pieces onto ours:

| BuildOn file | What it does | TradieConnect target |
|--------------|--------------|----------------------|
| `chatview/ChatView.jsx` | FlatList of messages, scroll-anchoring, load-previous, renders by `type` | `app/components/chat/ChatView.tsx` |
| `chatview/MessageBubble.jsx` | Text / image / document / tagged / event bubbles, avatar, timestamp grouping | `app/components/chat/MessageBubble.tsx` |
| `chatview/SendInput.jsx` | Composer: text input + send + attachment trigger + action buttons slot | `app/components/chat/ChatComposer.tsx` |
| `chatview/AttachmentViewer.jsx` | Full-screen image/file viewer | reuse `app/components/UI/ImageViewer.tsx` + wrapper |
| `chatscreen/AttachmentMenu.jsx` (+ `.native.jsx`) | Camera / gallery / document picker sheet | `app/components/chat/AttachmentMenu.tsx` (already started) |
| `chatview/ConnectionEventMessage.js` | Centered styled "system event" card (declined, accepted, completed…) | `app/components/chat/SystemMessage.tsx` |
| `chatview/TaskEventCard.jsx` / `OrderEventCard.jsx` | Left-border colored "entity event" cards | pattern reused for **QuoteEventCard** (price changed, accepted) |
| `chatscreen/ConnectionActionButtons.js` | Role/status-aware action buttons above composer (with cross-platform modals) | `app/components/chat/ChatActionButtons.tsx` |
| `chatscreen/ConnectionCard.js` | Chat-list row card (status badge, name, unread dot) | `app/components/chat/ChatRoomCard.tsx` |
| `chatscreen/ContactsList.jsx` | The chat-list screen (ownership switch, filters, search) | `app/screens/chat/ContactsListScreen.tsx` |
| `chatscreen/ChatFilterBar.jsx` | In-chat filter bar (All / Messages / Tasks / Orders) | `app/components/chat/ChatFilterBar.tsx` (adapt to Messages / Quote) |
| `notifications/UnreadMessagesBadge.js` | Unread dot/badge for nav | `app/components/UI/MessageNotification.tsx` (exists) |

> The existing `app/components/chat/QuoteCard.tsx` already renders a quote with Accept / Not Interested buttons and matches the BuildOn event-card style. Keep it; wire it into `ChatView` for `type: 'quote'` messages and switch its confirmations to the cross-platform `Modal` pattern (see `modal-pattern.md`) instead of `Alert.alert`.

---

## Firestore Collections

### `chatRooms`

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated |
| `serviceRequestId` | string | The request this chat is about |
| `quoteId` | string | The quote that opened this room |
| `customerId` | string | |
| `customerName` | string | Denormalized |
| `tradieId` | string | |
| `tradieName` | string | Denormalized |
| `trades` | string[] | Denormalized from request (for list display) |
| `suburb` | string | Denormalized from request |
| `quoteStatus` | `'pending' \| 'accepted' \| 'rejected'` | Mirror of the quote's status for fast list filtering |
| `status` | `'active' \| 'closed'` | Room lifecycle |
| `lastMessage` | string | Preview text for the chat list |
| `lastMessageAt` | Timestamp | Sort key for chat list |
| `lastMessageType` | string | So the list can show "📷 Photo", "📎 File" previews |
| `unreadByCustomer` | number | Unread count |
| `unreadByTradie` | number | Unread count |
| `participants` | string[] | `[customerId, tradieId]` — enables `array-contains` query for one combined list |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

### `chatRooms/{roomId}/messages` (subcollection)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated |
| `type` | `'text' \| 'quote' \| 'system' \| 'image' \| 'document'` | Drives rendering |
| `text` | string | Message text / caption |
| `senderId` | string | UID, or `'system'` |
| `senderName` | string | |
| `receiverId` | string | |
| `receiverName` | string | |
| `image` | string \| null | Storage URL (type: 'image') |
| `document` | `{ name, downloadURL, size, type } \| null` | (type: 'document') |
| `attachments` | array \| null | Optional multi-file array `[{ name, downloadURL, type }]` |
| `quoteData` | object \| null | Full quote snapshot (type: 'quote') |
| `systemAction` | string \| null | e.g. `'quote_accepted'`, `'quote_rejected'`, `'job_completed'` |
| `createdAt` | Timestamp | |

> **Shape note:** BuildOn nests the sender as `user: { id, name }`. To reuse `MessageBubble` with minimal changes, the chat service can map `senderId/senderName` → `user.id/user.name` when reading, or we store both. Pick one convention and document it in `chatService.ts`.

---

## Message Types

| Type | Rendered As | Who Creates |
|------|-------------|-------------|
| `quote` | `QuoteCard` — price, materials/labor, timeline, notes + Accept/Decline (customer) or "Waiting…" (tradie) | System on quote submit |
| `text` | Chat bubble (left = other, right = me) | Either party |
| `image` | Thumbnail → tap to open `ImageViewer` | Either party |
| `document` | File row (paperclip + name) → tap to open/download | Either party |
| `system` | Centered gray pill / styled event card | System (accept, reject, complete, reopen) |

Color conventions for left-border event/system cards (from BuildOn):
- Quote / price events → primary blue `#3B82F6`
- Document → green `#10B981`
- Accepted / success → `#059669`
- Declined / cancelled → `#DC2626`

---

## Contacts / Chat List Screen

Models BuildOn's `ContactsList.jsx`. This is the "all my conversations" screen, rendered from `chatRooms`.

**Data source:** query `chatRooms` where `participants array-contains uid`, ordered by `lastMessageAt desc`.

**Card (`ChatRoomCard`)** shows:
- Other party's name (customer sees tradie, tradie sees customer)
- Trade + suburb line
- Last message preview (with type icon for photo/file)
- Timestamp (`formatTimeAgo`)
- Unread dot / count badge
- Quote-status badge (Pending / Accepted / Declined)

**Filters (right-sliding `FilterDrawer`)** — see `ui-interaction-rules.md`:
- Quote status: All / Pending / Accepted / Declined
- Unread only (toggle)
- By trade
- By suburb
- Search by name (client-side over the loaded rooms, or `_tokens` field if we add search indexing)

**Sort:** Latest activity (default), Oldest, Name A–Z.

**Navigation:** tap a card → `ChatScreen` with `{ roomId, otherName, ... }`. We render this list "via quotes" conceptually (each room originates from a quote) and redirect into the chat window — matching BuildOn's connection→chat flow.

---

## Chat Screen Composition

```
<ChatScreen>
  <Header: other party name, trade/suburb, back />
  <ChatFilterBar />            // optional: All / Messages / Quote
  <ChatView                    // FlatList, renders by message.type
     messages
     onSendMessage
     onLoadMoreMessages
     onUpload />
  <ChatActionButtons />        // role + quoteStatus aware (Accept / Not Interested / Reopen)
  <ChatComposer />             // text + send + attachment menu
</ChatScreen>
```

Reuse BuildOn's scroll-anchoring logic in `ChatView` (keep position when loading older messages, auto-scroll to bottom on new message).

---

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `app/screens/chat/ContactsListScreen.tsx` | List of chat rooms (replaces/upgrades `ChatListScreen`) |
| 2 | `app/screens/chat/ChatScreen.tsx` | Conversation screen (exists — wire to new components) |
| 3 | `app/components/chat/ChatView.tsx` | Message FlatList + scroll anchoring |
| 4 | `app/components/chat/MessageBubble.tsx` | Text/image/document bubble |
| 5 | `app/components/chat/SystemMessage.tsx` | Centered system/event message |
| 6 | `app/components/chat/QuoteCard.tsx` | Quote display + actions (exists — refine) |
| 7 | `app/components/chat/ChatComposer.tsx` | Composer (text + send + attach) |
| 8 | `app/components/chat/AttachmentMenu.tsx` | Camera / gallery / document (exists — refine) |
| 9 | `app/components/chat/ChatActionButtons.tsx` | Accept/decline/reopen above composer |
| 10 | `app/components/chat/ChatRoomCard.tsx` | Chat-list row card |
| 11 | `app/components/chat/ChatFilterBar.tsx` | In-chat type filter |
| 12 | `app/services/chatService.ts` | Chat CRUD + subscriptions + field mapping |
| 13 | `app/hooks/useChatRooms.ts` | Subscribe to `chatRooms` for current user |
| 14 | `app/hooks/useChatMessages.ts` | Paginated message subscription for a room |

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `functions/src/modules/requests/submitQuote.ts` | Create `chatRoom` + first `quote` message + system message |
| 2 | `functions/src/modules/requests/acceptQuote.ts` | Add `system` message ("Quote accepted, details shared"); set `quoteStatus` on rooms |
| 3 | `functions/src/modules/chat/onMessageCreated.ts` | Already updates lastMessage/unread/push — extend for `lastMessageType` + dedup |
| 4 | `app/navigation/CustomerTabs.tsx` | Point Messages tab to `ContactsListScreen` |
| 5 | `app/navigation/TradieTabs.tsx` | Point Messages tab to `ContactsListScreen` |

---

## Cloud Function Behavior

### `submitQuote` (extend existing)
After the quote doc is written and intelligence recalculated:
1. Create `chatRooms/{roomId}` (denormalize names, trade, suburb, `participants`, `quoteStatus: 'pending'`).
2. Add first message `type: 'quote'` with a full `quoteData` snapshot.
3. Add `type: 'system'` message: "{tradieName} submitted a quote".
4. Increment `unreadByCustomer`.

### `acceptQuote` (extend existing)
1. Mark winning quote `accepted`, others `rejected`.
2. Update each affected room's `quoteStatus`.
3. Add `system` message to the accepted room: "Quote accepted — contact details shared".
4. Optionally add `system` message to rejected rooms: "Customer chose another quote".

### `onChatMessageCreated` (exists)
Already maintains `lastMessage`, unread counts, push + in-app notification. Add:
- Set `lastMessageType`.
- Notification **dedup** (BuildOn pattern): skip creating a new unread `notifications` doc if one already exists for the same `userId + type + itemId(roomId)` that is still unread. See `notifications-plan.md`.

---

## Indexes

| Collection | Fields | Purpose |
|-----------|--------|---------|
| `chatRooms` | `participants` ARRAY, `lastMessageAt` DESC | Combined chat list |
| `chatRooms` | `participants` ARRAY, `quoteStatus` ASC, `lastMessageAt` DESC | Filter list by status |
| `messages` (subcollection) | `createdAt` DESC | Message pagination (collection scope) |

---

## Dependencies

No new packages required — build custom (full control), reusing `expo-image-picker` and `expo-document-picker` already in the stack. `react-native-gifted-chat` is **not** used (BuildOn also rolls its own `ChatView`).

---

## Recommended Build Order

1. Backend: `submitQuote` creates room + quote message (Step 1)
2. `chatService.ts` + `useChatRooms` + `ContactsListScreen` (see your conversations)
3. `ChatView` + `MessageBubble` + `ChatComposer` (basic text messaging)
4. Wire `QuoteCard` into `ChatView` for `type: 'quote'`
5. `ChatActionButtons` (accept/decline/reopen) with cross-platform modals
6. Attachments (image/document) end-to-end
7. `onChatMessageCreated` unread counts + dedup + push
8. Unread badges on nav (`MessageNotification`) + chat-list filters
