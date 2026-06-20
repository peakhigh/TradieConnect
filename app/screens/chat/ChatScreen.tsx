import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { ArrowLeft, Send, Paperclip, FileText } from 'lucide-react-native';
import { formatTimeAgo } from '../../utils/helpers';
import QuoteCard from '../../components/chat/QuoteCard';
import AttachmentMenu from '../../components/chat/AttachmentMenu';
import { ImageViewer } from '../../components/UI/ImageViewer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Linking } from 'react-native';
import {
  ChatMessage,
  subscribeToMessages,
  sendTextMessage,
  sendAttachmentMessage,
  markRoomRead,
  getChatRoom,
} from '../../services/chatService';

export default function ChatScreen({ chatRoomId, otherPartyName }: { chatRoomId?: string; otherPartyName?: string }) {
  const { user } = useAuth();
  const { navigate } = useScreenNavigation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const receiverRef = useRef<{ receiverId: string; receiverName: string }>({ receiverId: '', receiverName: otherPartyName || '' });

  const senderName = (user as any)?.firstName || (user as any)?.displayName || 'User';

  // Resolve the receiver (other party) once so messages carry correct ids.
  useEffect(() => {
    if (!chatRoomId || !user) return;
    getChatRoom(chatRoomId).then((room) => {
      if (!room) return;
      const isTradie = user.id === room.tradieId;
      receiverRef.current = isTradie
        ? { receiverId: room.customerId, receiverName: room.customerName }
        : { receiverId: room.tradieId, receiverName: room.tradieName };
    });
  }, [chatRoomId, user?.id]);

  // Mark room read when opened.
  useEffect(() => {
    if (!chatRoomId || !user) return;
    markRoomRead(chatRoomId, user.userType === 'tradie' ? 'tradie' : 'customer').catch(() => {});
  }, [chatRoomId, user?.id]);

  // Subscribe to messages.
  useEffect(() => {
    if (!chatRoomId) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToMessages(
      chatRoomId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [chatRoomId]);

  const buildSender = () => ({
    senderId: user?.id || '',
    senderName,
    receiverId: receiverRef.current.receiverId,
    receiverName: receiverRef.current.receiverName || otherPartyName || '',
  });

  const handleSend = async () => {
    if (!newMessage.trim() || !chatRoomId || !user) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      await sendTextMessage(chatRoomId, text, buildSender());
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0] && chatRoomId) {
      await sendAttachmentMessage(chatRoomId, result.assets[0].uri, result.assets[0].fileName || `image_${Date.now()}.jpg`, 'image', buildSender());
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0] && chatRoomId) {
      await sendAttachmentMessage(chatRoomId, result.assets[0].uri, `photo_${Date.now()}.jpg`, 'image', buildSender());
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (!result.canceled && result.assets[0] && chatRoomId) {
      await sendAttachmentMessage(chatRoomId, result.assets[0].uri, result.assets[0].name, 'document', buildSender());
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

    // Image message — real thumbnail, tap to view
    if (item.type === 'image' && item.imageUrl) {
      return (
        <View style={[styles.messageBubbleRow, isMe && styles.messageBubbleRowRight]}>
          <View style={[styles.imageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
            {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
            <TouchableOpacity onPress={() => setViewerImage(item.imageUrl!)} activeOpacity={0.9}>
              <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
            </TouchableOpacity>
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>
      );
    }

    // Document message — tap to open
    if (item.type === 'document' && item.documentUrl) {
      return (
        <View style={[styles.messageBubbleRow, isMe && styles.messageBubbleRowRight]}>
          <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
            {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
            <TouchableOpacity
              style={styles.documentMessage}
              onPress={() => {
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.open(item.documentUrl!, '_blank');
                } else {
                  Linking.openURL(item.documentUrl!).catch(() => {});
                }
              }}
            >
              <FileText size={16} color={isMe ? '#ffffff' : theme.colors.primary} />
              <Text style={[styles.messageText, isMe && styles.myMessageText, { marginLeft: 6 }]} numberOfLines={1}>
                {item.documentName || 'Document'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>
      );
    }

    // Text message
    return (
      <View style={[styles.messageBubbleRow, isMe && styles.messageBubbleRowRight]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
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
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowAttachmentMenu(true)}
        >
          <Paperclip size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
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

      {/* Attachment Menu */}
      <AttachmentMenu
        visible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onPickImage={handlePickImage}
        onTakePhoto={handleTakePhoto}
        onPickDocument={handlePickDocument}
      />

      {/* Full-screen image viewer */}
      <ImageViewer
        visible={!!viewerImage}
        onClose={() => setViewerImage(null)}
        images={viewerImage ? [viewerImage] : []}
      />
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
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
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
  imageMessage: {
    marginBottom: 4,
  },
  imageBubble: {
    maxWidth: '75%',
    padding: 4,
    borderRadius: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  documentMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});
