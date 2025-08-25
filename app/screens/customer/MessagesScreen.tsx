import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, TextInput } from 'react-native';
import { Container } from '../../components/UI/Container';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { theme } from '../../theme/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Send, Filter } from 'lucide-react-native';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  requestId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  senderName: string;
}

export default function MessagesScreen() {
  const route = useRoute();
  const { user } = useAuth();
  const { requestId, tradieId } = route.params as { requestId?: string; tradieId?: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    let messagesQuery;
    
    if (requestId && tradieId) {
      // Messages for specific request and tradie
      messagesQuery = query(
        collection(db, 'messages'),
        where('requestId', '==', requestId),
        where('participants', 'array-contains', user.id),
        orderBy('timestamp', 'desc')
      );
    } else if (requestId) {
      // All messages for a specific request
      messagesQuery = query(
        collection(db, 'messages'),
        where('requestId', '==', requestId),
        where('participants', 'array-contains', user.id),
        orderBy('timestamp', 'desc')
      );
    } else {
      // All messages for the user
      messagesQuery = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', user.id),
        orderBy('timestamp', 'desc')
      );
    }

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Message[];
      setMessages(messagesData);
    });

    return unsubscribe;
  }, [user, requestId, tradieId]);

  const filteredMessages = messages.filter(message => 
    filter === 'all' || (filter === 'unread' && !message.isRead && message.receiverId === user?.id)
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !tradieId || !requestId) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.id,
        receiverId: tradieId,
        requestId: requestId,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        isRead: false,
        senderName: `${user.firstName} ${user.lastName}`,
        participants: [user.id, tradieId]
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = messages.filter(m => !m.isRead && m.receiverId === user?.id).length;

  return (
    <Container style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages ({messages.length})</Text>
        
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All ({messages.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unread' && styles.activeFilter]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        ) : (
          filteredMessages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.messageCard,
                message.senderId === user?.id ? styles.sentMessage : styles.receivedMessage
              ]}
            >
              <Text style={styles.senderName}>{message.senderName}</Text>
              <Text style={styles.messageContent}>{message.content}</Text>
              <Text style={styles.timestamp}>
                {message.timestamp.toLocaleDateString()} {message.timestamp.toLocaleTimeString()}
              </Text>
              {!message.isRead && message.receiverId === user?.id && (
                <View style={styles.unreadBadge} />
              )}
            </View>
          ))
        )}
      </ScrollView>

      {tradieId && requestId && (
        <View style={styles.messageInput}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={loading || !newMessage.trim()}
          >
            <Send size={20} color={loading ? '#9ca3af' : theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  activeFilter: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#6b7280',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#6b7280',
  },
  messageCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dbeafe',
    maxWidth: '80%',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  senderName: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  messageContent: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: Platform.OS === 'web' ? 12 : 10,
    color: '#9ca3af',
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  messageInput: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: Platform.OS === 'web' ? 16 : 14,
  },
  sendButton: {
    padding: 8,
  },
});