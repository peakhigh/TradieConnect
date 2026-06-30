import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import { useNotifications, AppNotification } from '../context/NotificationsContext';
import { useScreenNavigation } from '../navigation/NavigationContext';
import { formatTimeAgo } from '../utils/helpers';
import { Bell, MessageCircle, DollarSign, CheckCircle2, XCircle, Wallet, CheckCheck } from 'lucide-react-native';

const iconFor = (type: string) => {
  switch (type) {
    case 'chat_message': return MessageCircle;
    case 'quote': case 'new_quote': return DollarSign;
    case 'quote_accepted': return CheckCircle2;
    case 'quote_rejected': return XCircle;
    case 'wallet': return Wallet;
    default: return Bell;
  }
};

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const { navigate } = useScreenNavigation();

  const handlePress = (n: AppNotification) => {
    if (!n.read) markAsRead(n.id);
    // Route based on goto/type.
    if (n.goto === 'chatscreen' && n.itemId) {
      navigate('Chat', { chatRoomId: n.itemId });
    } else if (n.type === 'wallet') {
      navigate('Wallet');
    } else if (n.itemId) {
      navigate('Interests', { requestId: n.itemId });
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const Icon = iconFor(item.type);
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconCircle}>
          <Icon size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.itemTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerCount}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <CheckCheck size={16} color={theme.colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerBox}><Text style={styles.loadingText}>Loading...</Text></View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerBox}>
          <Bell size={48} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySubtitle}>You'll see updates about quotes, messages and jobs here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary },
  headerCount: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.colors.primaryLight },
  markAllText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  listContent: { paddingVertical: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  itemUnread: { backgroundColor: '#EFF6FF' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 15, fontWeight: '500', color: theme.colors.text.primary },
  itemTitleUnread: { fontWeight: '700' },
  itemMessage: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },
  itemTime: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary, marginLeft: 8 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: theme.colors.text.secondary },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
