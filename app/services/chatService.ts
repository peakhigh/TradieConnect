import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from './firebase';

export type ChatMessageType = 'text' | 'quote' | 'system' | 'image' | 'document';

export interface ChatRoom {
  id: string;
  serviceRequestId: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  tradieId: string;
  tradieName: string;
  trades?: string[];
  suburb?: string;
  quoteStatus?: 'pending' | 'accepted' | 'rejected';
  status: string;
  lastMessage: string;
  lastMessageType?: ChatMessageType;
  lastMessageAt: Date;
  unreadByCustomer: number;
  unreadByTradie: number;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  text: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  createdAt: Date;
  quoteData?: any;
  imageUrl?: string | null;
  documentUrl?: string | null;
  documentName?: string | null;
  systemAction?: string | null;
}

const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

/**
 * Subscribe to all chat rooms for a user (customer or tradie),
 * ordered by most recent activity.
 */
export function subscribeToChatRooms(
  userId: string,
  userType: 'customer' | 'tradie' | 'admin',
  onUpdate: (rooms: ChatRoom[]) => void,
  onError?: (e: any) => void
): () => void {
  const fieldToQuery = userType === 'tradie' ? 'tradieId' : 'customerId';
  const q = query(
    collection(db, 'chatRooms'),
    where(fieldToQuery, '==', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rooms: ChatRoom[] = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          serviceRequestId: data.serviceRequestId || '',
          quoteId: data.quoteId || '',
          customerId: data.customerId || '',
          customerName: data.customerName || 'Customer',
          tradieId: data.tradieId || '',
          tradieName: data.tradieName || 'Tradie',
          trades: data.trades || [],
          suburb: data.suburb || '',
          quoteStatus: data.quoteStatus,
          status: data.status || 'active',
          lastMessage: data.lastMessage || '',
          lastMessageType: data.lastMessageType || 'text',
          lastMessageAt: toDate(data.lastMessageAt),
          unreadByCustomer: data.unreadByCustomer || 0,
          unreadByTradie: data.unreadByTradie || 0,
          createdAt: toDate(data.createdAt),
        };
      });
      onUpdate(rooms);
    },
    (error) => {
      console.error('subscribeToChatRooms error:', error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to the latest messages in a room (most recent first).
 */
export function subscribeToMessages(
  chatRoomId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (e: any) => void,
  max = 50
): () => void {
  const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(max));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          type: data.type || 'text',
          text: data.text || '',
          senderId: data.senderId || '',
          senderName: data.senderName || '',
          receiverId: data.receiverId || '',
          receiverName: data.receiverName || '',
          createdAt: toDate(data.createdAt),
          quoteData: data.quoteData || null,
          imageUrl: data.imageUrl || null,
          documentUrl: data.documentUrl || null,
          documentName: data.documentName || null,
          systemAction: data.systemAction || null,
        };
      });
      onUpdate(messages);
    },
    (error) => {
      console.error('subscribeToMessages error:', error);
      onError?.(error);
    }
  );
}

interface SenderInfo {
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
}

/**
 * Send a text message. The onChatMessageCreated trigger maintains
 * lastMessage/unread counts + notifications, so we don't duplicate that here.
 */
export async function sendTextMessage(chatRoomId: string, text: string, sender: SenderInfo) {
  const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
  await addDoc(messagesRef, {
    type: 'text',
    text,
    ...sender,
    createdAt: serverTimestamp(),
  });
}

/**
 * Upload a file to Storage and post an image/document message.
 */
export async function sendAttachmentMessage(
  chatRoomId: string,
  uri: string,
  fileName: string,
  kind: 'image' | 'document',
  sender: SenderInfo
): Promise<void> {
  const path = `chat/${chatRoomId}/${Date.now()}_${fileName}`;
  const storageRef = ref(storage, path);
  const response = await fetch(uri);
  const blob = await response.blob();
  const uploadTask = uploadBytesResumable(storageRef, blob);

  await new Promise<void>((resolve, reject) => {
    uploadTask.on('state_changed', null, reject, () => resolve());
  });

  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
  const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');

  if (kind === 'image') {
    await addDoc(messagesRef, {
      type: 'image',
      text: '📷 Photo',
      imageUrl: downloadURL,
      ...sender,
      createdAt: serverTimestamp(),
    });
  } else {
    await addDoc(messagesRef, {
      type: 'document',
      text: `📎 ${fileName}`,
      documentUrl: downloadURL,
      documentName: fileName,
      ...sender,
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Reset the unread counter for the current viewer when they open a room.
 */
export async function markRoomRead(chatRoomId: string, userType: 'customer' | 'tradie') {
  const field = userType === 'tradie' ? 'unreadByTradie' : 'unreadByCustomer';
  await updateDoc(doc(db, 'chatRooms', chatRoomId), { [field]: 0 });
}

/**
 * Fetch a single chat room (used to resolve receiver info before sending).
 */
export async function getChatRoom(chatRoomId: string): Promise<ChatRoom | null> {
  const snap = await getDoc(doc(db, 'chatRooms', chatRoomId));
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    id: snap.id,
    serviceRequestId: data.serviceRequestId || '',
    quoteId: data.quoteId || '',
    customerId: data.customerId || '',
    customerName: data.customerName || 'Customer',
    tradieId: data.tradieId || '',
    tradieName: data.tradieName || 'Tradie',
    trades: data.trades || [],
    suburb: data.suburb || '',
    quoteStatus: data.quoteStatus,
    status: data.status || 'active',
    lastMessage: data.lastMessage || '',
    lastMessageType: data.lastMessageType || 'text',
    lastMessageAt: toDate(data.lastMessageAt),
    unreadByCustomer: data.unreadByCustomer || 0,
    unreadByTradie: data.unreadByTradie || 0,
    createdAt: toDate(data.createdAt),
  };
}
