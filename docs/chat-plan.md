# Chat & Messaging — Implementation Plan

## Concept

When a tradie submits a quote, a chat room is automatically created between the tradie and the customer. The quote is displayed as a special "quote card" message in the chat window. The customer can accept or decline directly from the chat. Both parties can then communicate, share files, and coordinate the job.

---

## How It Works (Flow)

```
1. Tradie submits quote → Cloud Function creates chatRoom + sends quote as first message
2. Customer sees chat in Messages tab → opens chat → sees quote card
3. Customer can: Accept Quote / Not Interested (action buttons in chat)
4. If accepted: request status → 'assigned', contact details shared
5. Both parties can now chat freely, share images/docs
6. Job completes → customer rates from chat or dashboard
```

---

## Firestore Collections Needed

### `chatRooms` (new)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated |
| `serviceRequestId` | string | The request this chat is about |
| `quoteId` | string | The quote doc ID |
| `customerId` | string | |
| `customerName` | string | Denormalized |
| `tradieId` | string | |
| `tradieName` | string | Denormalized |
| `status` | `'active' \| 'closed'` | |
| `lastMessage` | string | Preview text for chat list |
| `lastMessageAt` | Timestamp | For sorting chat list |
| `unreadByCustomer` | number | Unread count |
| `unreadByTradie` | number | Unread count |
| `createdAt` | Timestamp | |

### `chatRooms/{roomId}/messages` (subcollection)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated |
| `type` | `'text' \| 'quote' \| 'system' \| 'image' \| 'document'` | Message type |
| `text` | string | Message text |
| `senderId` | string | Who sent it |
| `senderName` | string | |
| `receiverId` | string | |
| `receiverName` | string | |
| `createdAt` | Timestamp | |
| `quoteData` | object \| null | Full quote details (for type: 'quote') |
| `imageUrl` | string \| null | For type: 'image' |
| `documentUrl` | string \| null | For type: 'document' |
| `documentName` | string \| null | |
| `systemAction` | string \| null | For type: 'system' (e.g. 'quote_accepted', 'quote_rejected') |

---

## Message Types

| Type | Rendered As | Who Creates |
|------|-------------|-------------|
| `quote` | Quote card with price, timeline, materials breakdown + Accept/Decline buttons | System (on quote submit) |
| `text` | Normal chat bubble | Either party |
| `image` | Image thumbnail + tap to view | Either party |
| `document` | File icon + name + tap to download | Either party |
| `system` | Centered gray text (e.g. "Quote accepted", "Job completed") | System |

---

## Implementation Steps

### Step 1: Create `chatRooms` collection + update `submitQuote` Cloud Function
- When a quote is submitted, create a `chatRooms` document
- Add the first message (type: 'quote') with full quote data
- Add a system message: "Tradie submitted a quote"

### Step 2: Chat List Screen (`MessagesScreen`)
- Query `chatRooms` where `customerId == user.id` OR `tradieId == user.id`
- Show: other party's name, last message preview, timestamp, unread badge
- Sort by `lastMessageAt` desc
- Tap → navigate to ChatScreen

### Step 3: Chat Screen (core)
- Subscribe to `chatRooms/{roomId}/messages` ordered by `createdAt desc`
- Render messages based on `type`:
  - `text` → chat bubble (left/right based on sender)
  - `quote` → QuoteCard component with action buttons
  - `image` → image thumbnail
  - `document` → file attachment row
  - `system` → centered gray text
- Message composer at bottom (text input + send button)
- Attachment button (camera, gallery, document picker)

### Step 4: Quote Card in Chat
- Shows: trade type, total price, materials/labor breakdown, timeline, notes
- **Customer sees**: "Accept Quote" + "Not Interested" buttons
- **Tradie sees**: "Waiting for response" status
- On accept: calls `acceptQuote` Cloud Function, adds system message
- On decline: updates quote status, adds system message

### Step 5: Action Buttons (above composer)
- Similar to BuildOn's `ConnectionActionButtons`
- Show different buttons based on role + quote status:
  - Customer + pending quote → "Accept" / "Not Interested"
  - Tradie + pending quote → disabled (waiting)
  - After acceptance → no action buttons (free chat)

### Step 6: File/Image Upload in Chat
- Attachment menu: Camera, Gallery, Document
- Upload to Firebase Storage → send message with URL
- Render as image thumbnail or document link

### Step 7: Update Cloud Functions
- `submitQuote`: also create chatRoom + first quote message
- `acceptQuote`: add system message to chat ("Quote accepted! Contact details shared.")
- New trigger: on message created → increment unread count + send push notification

### Step 8: Unread Badges
- Show unread count on Messages tab/sidebar
- Mark messages as read when chat is opened

---

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `app/screens/chat/ChatListScreen.tsx` | List of chat rooms |
| 2 | `app/screens/chat/ChatScreen.tsx` | Individual chat conversation |
| 3 | `app/components/chat/QuoteCard.tsx` | Quote display in chat with action buttons |
| 4 | `app/components/chat/MessageBubble.tsx` | Text message bubble |
| 5 | `app/components/chat/SystemMessage.tsx` | System event message |
| 6 | `app/components/chat/ImageMessage.tsx` | Image message |
| 7 | `app/components/chat/DocumentMessage.tsx` | Document/file message |
| 8 | `app/components/chat/ChatComposer.tsx` | Text input + send + attachment |
| 9 | `app/components/chat/AttachmentMenu.tsx` | Camera/gallery/document picker |
| 10 | `app/components/chat/ChatActionButtons.tsx` | Accept/decline buttons above composer |
| 11 | `app/services/chatService.ts` | Chat CRUD operations |
| 12 | `functions/src/modules/chat/onMessageCreated.ts` | Trigger: update lastMessage, unread counts, push notification |

---

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `functions/src/modules/requests/submitQuote.ts` | Create chatRoom + first quote message |
| 2 | `functions/src/modules/requests/acceptQuote.ts` | Add system message to chat |
| 3 | `functions/src/index.ts` | Export new chat trigger |
| 4 | `app/navigation/CustomerTabs.tsx` | Wire Messages to ChatListScreen |
| 5 | `app/navigation/TradieTabs.tsx` | Wire Messages to ChatListScreen |

---

## Dependencies Needed

- `react-native-gifted-chat` — OR build custom (BuildOn uses custom ChatView)
- No new packages needed if we build custom (recommended for full control)

---

## Recommended Order

1. **Step 1** — Backend: create chatRoom on quote submit
2. **Step 2** — Chat List Screen (see your conversations)
3. **Step 3** — Chat Screen (basic text messaging)
4. **Step 4** — Quote Card in chat (the special first message)
5. **Step 5** — Action buttons (accept/decline from chat)
6. **Step 6** — File uploads in chat
7. **Step 7** — Cloud Function triggers (unread counts, push)
8. **Step 8** — Unread badges on nav
