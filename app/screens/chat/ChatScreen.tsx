import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import {
  db,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  startAfter,
  getDocs,
} from '../../services/firebase';
import { ArrowLeft, Send } from 'lucide-react-native';
import { formatTimeAgo } from '../../utils/helpers';
import QuoteCard from '../../components/chat/QuoteCard';

interface ChatMessage {
  id: string;
  type: 'text' | 'quote' | 'system' | 'image' | 'document';
  text: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  createdAt: Date;
  quoteData?: any;
  imageUrl?: string;
  documentUrl?: string;
  documentName?: string;
  systemAction?: string;
}

export default function ChatScreen({ chatRoomId, otherPartyName }: { chatRoomId?: string; otherPartyName?: string }) {
  const { user } = useAuth();
  const { navigate } = useScreenNavigation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Subscribe to new messages (real-time)
  useEffect(() => {
    if (!chatRoomId) {
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'text',
          text: data.text || '',
          senderId: data.senderId || '',
          senderName: data.senderName || '',
          receiverId: data.receiverId || '',
          receiverName: data.receiverName || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          quoteData: data.quoteData || null,
          imageUrl: data.imageUrl || null,
          documentUrl: data.documentUrl || null,
          documentName: data.documentName || null,
          systemAction: data.systemAction || null,
        };
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error('Chat subscription error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatRoomId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chatRoomId || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
      await addDoc(messagesRef, {
        type: 'text',
        text: messageText,
        senderId: user.id,
        senderName: (user as any).firstName || (user as any).displayName || 'User',
        receiverId: '', // Will be filled by context
        receiverName: otherPartyName || '',
        createdAt: serverTimestamp(),
      });

      // Update lastMessage on chatRoom
      const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
      const chatRoomRef = firestoreDoc(db, 'chatRooms', chatRoomId);
      await updateDoc(chatRoomRef, {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.id;

    // System message
    if (item.type === 'system') {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    // Quote message
    if (item.type === 'quote' && item.quoteData) {
      return (
        <QuoteCard
          quoteData={item.quoteData}
          chatRoomId={chatRoomId || ''}
          isCustomer={user?.userType === 'customer'}
        />
      );
    }

    // Text message
    return (
      <View style={[styles.messageBubbleRow, isMe && styles.messageBubbleRowRight]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (!chatRoomId) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Select a conversation to start chatting</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Messages')} style={styles.backButton}>
          <ArrowLeft size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{otherPartyName || 'Chat'}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          <Send size={20} color={newMessage.trim() ? '#ffffff' : theme.colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // System message
  systemMessage: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  systemText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
  },
  // Message bubbles
  messageBubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  messageBubbleRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Composer
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text.primary,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});
