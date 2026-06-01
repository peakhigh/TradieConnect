import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { db, collection, query, where, orderBy, onSnapshot } from '../../services/firebase';
import { MessageCircle, Clock } from 'lucide-react-native';
import { formatTimeAgo } from '../../utils/helpers';

interface ChatRoom {
  id: string;
  serviceRequestId: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  tradieId: string;
  tradieName: string;
  status: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadByCustomer: number;
  unreadByTradie: number;
  createdAt: Date;
}

export default function ChatListScreen() {
  const { user } = useAuth();
  const { navigate } = useScreenNavigation();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Query chatRooms where user is either customer or tradie
    const isTradie = user.userType === 'tradie';
    const fieldToQuery = isTradie ? 'tradieId' : 'customerId';

    const q = query(
      collection(db, 'chatRooms'),
      where(fieldToQuery, '==', user.id),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms: ChatRoom[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          serviceRequestId: data.serviceRequestId || '',
          quoteId: data.quoteId || '',
          customerId: data.customerId || '',
          customerName: data.customerName || 'Customer',
          tradieId: data.tradieId || '',
          tradieName: data.tradieName || 'Tradie',
          status: data.status || 'active',
          lastMessage: data.lastMessage || '',
          lastMessageAt: data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : new Date(),
          unreadByCustomer: data.unreadByCustomer || 0,
          unreadByTradie: data.unreadByTradie || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });
      setChatRooms(rooms);
      setLoading(false);
    }, (error) => {
      console.error('ChatList subscription error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, user?.userType]);

  const getOtherPartyName = (room: ChatRoom) => {
    return user?.userType === 'tradie' ? room.customerName : room.tradieName;
  };

  const getUnreadCount = (room: ChatRoom) => {
    return user?.userType === 'tradie' ? room.unreadByTradie : room.unreadByCustomer;
  };

  const handleOpenChat = (room: ChatRoom) => {
    navigate('Chat', { chatRoomId: room.id, otherPartyName: getOtherPartyName(room) });
  };

  const renderChatItem = ({ item }: { item: ChatRoom }) => {
    const otherName = getOtherPartyName(item);
    const unread = getUnreadCount(item);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {otherName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, unread > 0 && styles.chatNameUnread]} numberOfLines={1}>
              {otherName}
            </Text>
            <Text style={styles.chatTime}>
              {formatTimeAgo(item.lastMessageAt)}
            </Text>
          </View>
          <View style={styles.chatPreview}>
            <Text style={[styles.chatMessage, unread > 0 && styles.chatMessageUnread]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </Container>
    );
  }

  if (chatRooms.length === 0) {
    return (
      <Container>
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            {user?.userType === 'tradie'
              ? 'Submit a quote to start a conversation with a customer.'
              : 'You\'ll see conversations here when tradies quote on your requests.'}
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerCount}>{chatRooms.length} conversation{chatRooms.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Chat List */}
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerCount: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  listContent: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  chatContent: {
    flex: 1,
    marginLeft: 14,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
    flex: 1,
  },
  chatNameUnread: {
    fontWeight: '700',
  },
  chatTime: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginLeft: 8,
  },
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  chatMessageUnread: {
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
