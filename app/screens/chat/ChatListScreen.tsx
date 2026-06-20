import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput } from 'react-native';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { MessageCircle, Search, X } from 'lucide-react-native';
import { formatTimeAgo } from '../../utils/helpers';
import { ChatRoom, subscribeToChatRooms } from '../../services/chatService';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Declined' },
];

const previewPrefix = (type?: string) => {
  if (type === 'image') return '📷 ';
  if (type === 'document') return '📎 ';
  if (type === 'quote') return '💰 ';
  return '';
};

export default function ChatListScreen() {
  const { user } = useAuth();
  const { navigate } = useScreenNavigation();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToChatRooms(
      user.id,
      user.userType as any,
      (rooms) => {
        setChatRooms(rooms);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user?.id, user?.userType]);

  const isTradie = user?.userType === 'tradie';
  const getOtherPartyName = (room: ChatRoom) => (isTradie ? room.customerName : room.tradieName);
  const getUnreadCount = (room: ChatRoom) => (isTradie ? room.unreadByTradie : room.unreadByCustomer);

  const filtered = useMemo(() => {
    let rooms = chatRooms;
    if (statusFilter !== 'all') {
      rooms = rooms.filter((r) => (r.quoteStatus || 'pending') === statusFilter);
    }
    if (unreadOnly) {
      rooms = rooms.filter((r) => getUnreadCount(r) > 0);
    }
    if (search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      rooms = rooms.filter((r) =>
        getOtherPartyName(r).toLowerCase().includes(q) ||
        (r.trades || []).some((t) => t.toLowerCase().includes(q)) ||
        (r.suburb || '').toLowerCase().includes(q)
      );
    }
    return rooms;
  }, [chatRooms, statusFilter, unreadOnly, search, isTradie]);

  const handleOpenChat = (room: ChatRoom) => {
    navigate('Chat', { chatRoomId: room.id, otherPartyName: getOtherPartyName(room) });
  };

  const renderChatItem = ({ item }: { item: ChatRoom }) => {
    const otherName = getOtherPartyName(item);
    const unread = getUnreadCount(item);
    const status = item.quoteStatus || 'pending';

    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => handleOpenChat(item)} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{otherName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, unread > 0 && styles.chatNameUnread]} numberOfLines={1}>
              {otherName}
            </Text>
            <Text style={styles.chatTime}>{formatTimeAgo(item.lastMessageAt)}</Text>
          </View>
          {(item.trades?.length || item.suburb) ? (
            <Text style={styles.chatMeta} numberOfLines={1}>
              {(item.trades || []).join(', ')}{item.suburb ? ` • ${item.suburb}` : ''}
            </Text>
          ) : null}
          <View style={styles.chatPreview}>
            <Text style={[styles.chatMessage, unread > 0 && styles.chatMessageUnread]} numberOfLines={1}>
              {previewPrefix(item.lastMessageType)}{item.lastMessage}
            </Text>
            <View style={styles.previewRight}>
              <View style={[styles.statusDot, statusStyle(status)]} />
              {unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unread}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerCount}>
          {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={16} color={theme.colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, trade, suburb"
          placeholderTextColor={theme.colors.text.tertiary}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterChip, unreadOnly && styles.filterChipActive]}
          onPress={() => setUnreadOnly((v) => !v)}
        >
          <Text style={[styles.filterChipText, unreadOnly && styles.filterChipTextActive]}>Unread</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <MessageCircle size={48} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>
            {chatRooms.length === 0 ? 'No conversations yet' : 'No matching conversations'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {chatRooms.length === 0
              ? isTradie
                ? 'Submit a quote to start a conversation with a customer.'
                : "You'll see conversations here when tradies quote on your requests."
              : 'Try adjusting your filters or search.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const statusStyle = (status: string) => {
  switch (status) {
    case 'accepted':
      return { backgroundColor: '#059669' };
    case 'rejected':
      return { backgroundColor: '#DC2626' };
    default:
      return { backgroundColor: '#D97706' };
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary },
  headerCount: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.colors.text.primary, paddingVertical: 0 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface,
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
  filterChipTextActive: { color: '#ffffff' },
  listContent: { paddingVertical: 8 },
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
  avatarText: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  chatContent: { flex: 1, marginLeft: 14 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  chatName: { fontSize: 15, fontWeight: '500', color: theme.colors.text.primary, flex: 1 },
  chatNameUnread: { fontWeight: '700' },
  chatTime: { fontSize: 12, color: theme.colors.text.tertiary, marginLeft: 8 },
  chatMeta: { fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 2 },
  chatPreview: { flexDirection: 'row', alignItems: 'center' },
  chatMessage: { fontSize: 13, color: theme.colors.text.secondary, flex: 1 },
  chatMessageUnread: { color: theme.colors.text.primary, fontWeight: '500' },
  previewRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 11, fontWeight: '700', color: '#ffffff' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: theme.colors.text.secondary },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary, marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
