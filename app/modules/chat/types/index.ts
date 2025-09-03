/**
 * Reusable chat types for marketplace applications
 */

export interface Conversation {
  id: string;
  participants: Participant[];
  type: 'direct' | 'group' | 'support';
  metadata: ConversationMetadata;
  lastMessage?: Message;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  userId: string;
  role: 'customer' | 'provider' | 'admin' | 'support';
  joinedAt: Date;
  leftAt?: Date;
  permissions: ParticipantPermissions;
}

export interface ParticipantPermissions {
  canSendMessages: boolean;
  canSendFiles: boolean;
  canSendVoice: boolean;
  canDeleteMessages: boolean;
  canAddParticipants: boolean;
  canRemoveParticipants: boolean;
}

export interface ConversationMetadata {
  title?: string;
  description?: string;
  avatar?: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'active' | 'archived' | 'closed';
  // App-specific metadata
  requestId?: string;
  quoteId?: string;
  orderId?: string;
  [key: string]: any;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: MessageContent;
  type: MessageType;
  status: MessageStatus;
  replyTo?: string;
  reactions: MessageReaction[];
  editHistory: MessageEdit[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'file' 
  | 'voice' 
  | 'video' 
  | 'location' 
  | 'system' 
  | 'quote' 
  | 'payment';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageContent {
  text?: string;
  file?: FileAttachment;
  location?: LocationData;
  system?: SystemMessageData;
  quote?: QuoteData;
  payment?: PaymentData;
}

export interface FileAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
  thumbnail?: string;
  duration?: number; // for audio/video files
  dimensions?: { width: number; height: number }; // for images/videos
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface SystemMessageData {
  type: 'user_joined' | 'user_left' | 'conversation_created' | 'status_changed' | 'custom';
  data: { [key: string]: any };
}

export interface QuoteData {
  quoteId: string;
  amount: number;
  currency: string;
  description: string;
  validUntil?: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export interface PaymentData {
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface MessageEdit {
  content: MessageContent;
  editedAt: Date;
  reason?: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ChatState {
  conversations: { [id: string]: Conversation };
  messages: { [conversationId: string]: Message[] };
  activeConversation: string | null;
  isLoading: boolean;
  error: string | null;
  typingUsers: { [conversationId: string]: string[] };
}

export interface SendMessageData {
  conversationId: string;
  content: MessageContent;
  type: MessageType;
  replyTo?: string;
  metadata?: { [key: string]: any };
}

export interface CreateConversationData {
  participants: string[];
  type: 'direct' | 'group' | 'support';
  metadata?: Partial<ConversationMetadata>;
  initialMessage?: Omit<SendMessageData, 'conversationId'>;
}

export interface ChatSettings {
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    preview: boolean;
  };
  privacy: {
    readReceipts: boolean;
    lastSeen: boolean;
    typing: boolean;
  };
  media: {
    autoDownload: boolean;
    compression: 'none' | 'low' | 'medium' | 'high';
    maxFileSize: number;
  };
}

export interface ChatFilter {
  status?: ConversationMetadata['status'][];
  type?: Conversation['type'][];
  priority?: ConversationMetadata['priority'][];
  hasUnread?: boolean;
  participants?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ChatSearchResult {
  conversation: Conversation;
  message: Message;
  snippet: string;
  highlights: string[];
}