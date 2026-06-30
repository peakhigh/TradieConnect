import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Container } from '../../components/UI/Container';
import { StatCard } from '../../components/UI/StatCard';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { useFetchDocs } from '../../hooks/useFetchDocs';
import { formatCurrency, formatTimeAgo } from '../../utils/helpers';
import {
  Sparkles, Search, Wallet, TrendingUp, MessageCircle,
  CheckCircle2, XCircle, FileText, Unlock, Gift,
} from 'lucide-react-native';

// Convert any Firestore timestamp shape to epoch millis for sorting/formatting.
const toMillis = (ts: any): number => {
  if (!ts) return 0;
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (ts.seconds || ts._seconds) return (ts.seconds || ts._seconds) * 1000;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

interface QuoteDoc {
  id: string;
  status: string;
  amount?: number;
  totalPrice?: number;
  trades?: string[];
  tradeType?: string;
  suburb?: string;
  createdAt?: any;
}

interface WalletTxnDoc {
  id: string;
  type: 'recharge' | 'unlock' | 'bonus';
  amount?: number;
  description?: string;
  createdAt?: any;
}

interface ActivityItem {
  id: string;
  icon: any;
  color: string;
  title: string;
  subtitle: string;
  millis: number;
}

export default function TradieDashboard() {
  const { user } = useAuth();
  const navigation = useScreenNavigation();

  const { documents: quotes, loading: quotesLoading } = useFetchDocs<QuoteDoc>({
    collectionName: 'quotes',
    wheres: [['tradieId', '==', user?.id || '']],
    orderBys: [['createdAt', 'desc']],
    limitCount: 8,
    subscribe: true,
  });

  const { documents: walletTxns, loading: txnsLoading } = useFetchDocs<WalletTxnDoc>({
    collectionName: 'walletTransactions',
    wheres: [['userId', '==', user?.id || '']],
    orderBys: [['createdAt', 'desc']],
    limitCount: 8,
    subscribe: true,
  });

  const activityLoading = quotesLoading || txnsLoading;

  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    for (const q of quotes) {
      const trade = q.trades?.join(', ') || q.tradeType || 'a request';
      const where = q.suburb ? ` in ${q.suburb}` : '';
      const value = q.amount ?? q.totalPrice ?? 0;
      if (q.status === 'accepted') {
        items.push({ id: `q-${q.id}`, icon: CheckCircle2, color: theme.colors.success, title: 'Quote accepted', subtitle: `${trade}${where} • ${formatCurrency(value)}`, millis: toMillis(q.createdAt) });
      } else if (q.status === 'rejected') {
        items.push({ id: `q-${q.id}`, icon: XCircle, color: theme.colors.error, title: 'Quote declined', subtitle: `${trade}${where} • ${formatCurrency(value)}`, millis: toMillis(q.createdAt) });
      } else if (q.status === 'unlocked') {
        items.push({ id: `q-${q.id}`, icon: Unlock, color: theme.colors.primary, title: 'Request unlocked', subtitle: `${trade}${where}`, millis: toMillis(q.createdAt) });
      } else {
        items.push({ id: `q-${q.id}`, icon: FileText, color: theme.colors.warning, title: 'Quote submitted', subtitle: `${trade}${where} • ${formatCurrency(value)}`, millis: toMillis(q.createdAt) });
      }
    }

    for (const t of walletTxns) {
      const amt = t.amount ?? 0;
      if (t.type === 'recharge') {
        items.push({ id: `w-${t.id}`, icon: Wallet, color: theme.colors.success, title: 'Wallet recharged', subtitle: t.description || `+${formatCurrency(Math.abs(amt))}`, millis: toMillis(t.createdAt) });
      } else if (t.type === 'bonus') {
        items.push({ id: `w-${t.id}`, icon: Gift, color: theme.colors.success, title: 'Bonus credited', subtitle: t.description || `+${formatCurrency(Math.abs(amt))}`, millis: toMillis(t.createdAt) });
      } else if (t.type === 'unlock') {
        items.push({ id: `w-${t.id}`, icon: Unlock, color: theme.colors.primary, title: 'Request unlocked', subtitle: t.description || `-${formatCurrency(Math.abs(amt))}`, millis: toMillis(t.createdAt) });
      }
    }

    return items.sort((a, b) => b.millis - a.millis).slice(0, 6);
  }, [quotes, walletTxns]);

  const handleExploreJobs = () => {
    navigation.navigate('Explorer');
  };

  const handleViewWallet = () => {
    navigation.navigate('Wallet');
  };

  const handleViewMessages = () => {
    navigation.navigate('Messages');
  };

  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  <Sparkles size={24} color={theme.colors.primary} /> Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
                </Text>
                <Text style={styles.subtitle}>
                  Ready to find your next job opportunity?
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity onPress={handleExploreJobs} style={styles.linkButton}>
              <Search size={20} color={theme.colors.primary} />
              <Text style={styles.linkButtonText}>Explore Jobs</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Performance</Text>
            <View style={styles.statsGrid}>
              <StatCard
                number={user?.walletBalance || 0}
                label="Wallet Balance"
                color={theme.colors.success}
                onPress={handleViewWallet}
              />
              <StatCard
                number={user?.totalJobs || 0}
                label="Total Jobs"
                color={theme.colors.primary}
              />
              <StatCard
                number={user?.rating || 0}
                label="Rating"
                color={theme.colors.warning}
              />
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {activityLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : activity.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No recent activity. Start exploring jobs to get started!
                </Text>
              </View>
            ) : (
              <View style={styles.activityList}>
                {activity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <View key={item.id} style={styles.activityRow}>
                      <View style={[styles.activityIcon, { backgroundColor: item.color + '20' }]}>
                        <Icon size={18} color={item.color} />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.activitySubtitle} numberOfLines={1}>{item.subtitle}</Text>
                      </View>
                      {item.millis > 0 && (
                        <Text style={styles.activityTime}>{formatTimeAgo(new Date(item.millis))}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={handleExploreJobs}>
                <Search size={32} color={theme.colors.primary} />
                <Text style={styles.actionTitle}>Find Jobs</Text>
                <Text style={styles.actionSubtitle}>Browse available requests</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard} onPress={handleViewWallet}>
                <Wallet size={32} color={theme.colors.success} />
                <Text style={styles.actionTitle}>Wallet</Text>
                <Text style={styles.actionSubtitle}>Manage your credits</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard} onPress={handleViewMessages}>
                <MessageCircle size={32} color={theme.colors.info} />
                <Text style={styles.actionTitle}>Messages</Text>
                <Text style={styles.actionSubtitle}>Chat with customers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Insights')}>
                <TrendingUp size={32} color={theme.colors.warning} />
                <Text style={styles.actionTitle}>Analytics</Text>
                <Text style={styles.actionSubtitle}>View performance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xxl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  title: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.xxl : theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.md : theme.fontSize.sm,
    color: theme.colors.text.secondary,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  quickActions: {
    marginBottom: theme.spacing.xxl,
    alignItems: 'flex-end',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  linkButtonText: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.lg : theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6b7280',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  activityList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  activityTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  activitySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});