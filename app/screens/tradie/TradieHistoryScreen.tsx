import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Container } from '../../components/UI/Container';
import { EmptyState } from '../../components/UI/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useFetchDocs } from '../../hooks/useFetchDocs';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { theme } from '../../theme/theme';
import { Calendar, DollarSign, Trophy, Pencil, XCircle, AlertTriangle } from 'lucide-react-native';
import { formatCurrency, timestampToReadable } from '../../utils/helpers';
import { runCloudFunction } from '../../services/cloudFunctions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAlert } from '../../components/UI/AlertProvider';

interface QuoteDoc {
  id: string;
  serviceRequestId: string;
  tradieId: string;
  amount?: number;
  totalPrice?: number;
  materialsCost?: number;
  laborCost?: number;
  timelineDays?: number;
  notes?: string;
  status: 'unlocked' | 'pending' | 'quoted' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: any;
  tradeType?: string;
  trades?: string[];
  postcode?: string;
  suburb?: string;
}

export default function TradieHistoryScreen() {
  const { user } = useAuth();
  const navigation = useScreenNavigation();
  const { showAlert } = useAlert();
  const [tab, setTab] = useState<'quotes' | 'completed'>('quotes');
  const [withdrawTarget, setWithdrawTarget] = useState<QuoteDoc | null>(null);
  const [busy, setBusy] = useState(false);

  const { documents: quotes, loading, refresh } = useFetchDocs<QuoteDoc>({
    collectionName: 'quotes',
    wheres: [['tradieId', '==', user?.id || '']],
    orderBys: [['createdAt', 'desc']],
    limitCount: 50,
    subscribe: false,
  });

  // Edit a submitted quote: load its full request, then open SubmitQuote in edit mode.
  const handleEdit = async (quote: QuoteDoc) => {
    try {
      const reqSnap = await getDoc(doc(db, 'serviceRequests', quote.serviceRequestId));
      const reqData = reqSnap.exists() ? { id: reqSnap.id, ...reqSnap.data() } : null;
      navigation.navigate('SubmitQuote', {
        request: reqData,
        editQuote: {
          quoteId: quote.id,
          totalPrice: quote.totalPrice,
          timelineDays: (quote as any).timelineDays,
          materialsCost: (quote as any).materialsCost,
          laborCost: (quote as any).laborCost,
          notes: (quote as any).notes,
        },
      });
    } catch {
      showAlert('Error', 'Could not open this quote for editing.', undefined, { tone: 'destructive' });
    }
  };

  const confirmWithdraw = async () => {
    if (!withdrawTarget) return;
    setBusy(true);
    try {
      await runCloudFunction('withdrawQuote', { quoteId: withdrawTarget.id });
      setWithdrawTarget(null);
      refresh();
    } catch (e: any) {
      showAlert('Error', e?.message || 'Failed to withdraw quote', undefined, { tone: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  // Tab split: "Quotes" = submitted/pending/rejected; "Completed Jobs" = accepted (won).
  const visibleQuotes = quotes.filter((q) => {
    const isAccepted = q.status === 'accepted';
    return tab === 'completed' ? isAccepted : q.status === 'pending' || q.status === 'quoted' || q.status === 'rejected';
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return { bg: theme.colors.success + '20', text: theme.colors.success };
      case 'rejected':
        return { bg: theme.colors.error + '20', text: theme.colors.error };
      case 'pending':
      default:
        return { bg: theme.colors.warning + '20', text: theme.colors.warning };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      case 'quoted':
        return 'Quoted';
      case 'unlocked':
        return 'Unlocked';
      default:
        return status;
    }
  };

  return (
    <Container scrollable={false} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Your quotes and completed jobs</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'quotes' && styles.tabBtnActive]}
              onPress={() => setTab('quotes')}
            >
              <Text style={[styles.tabText, tab === 'quotes' && styles.tabTextActive]}>Quotes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'completed' && styles.tabBtnActive]}
              onPress={() => setTab('completed')}
            >
              <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>Completed Jobs</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
          ) : visibleQuotes.length === 0 ? (
            <EmptyState
              title={tab === 'completed' ? 'No Completed Jobs Yet' : 'No Quotes Yet'}
              message={tab === 'completed'
                ? 'Jobs you win will appear here.'
                : 'Quotes you submit will appear here. Start exploring service requests!'}
            />
          ) : (
            visibleQuotes.map((quote) => {
              const statusStyle = getStatusBadgeStyle(quote.status);
              const quoteAmount = quote.amount || quote.totalPrice || 0;
              const tradeDisplay = quote.trades?.join(', ') || quote.tradeType || 'Service';
              const locationDisplay = quote.postcode || quote.suburb || '';

              return (
                <View key={quote.id} style={styles.quoteCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.tradeType}>{tradeDisplay}</Text>
                      {locationDisplay ? (
                        <Text style={styles.postcode}>{locationDisplay}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {getStatusLabel(quote.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.metaItem}>
                      <DollarSign size={14} color={theme.colors.text.secondary} />
                      <Text style={styles.metaText}>{formatCurrency(quoteAmount)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={theme.colors.text.secondary} />
                      <Text style={styles.metaText}>
                        {timestampToReadable(quote.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {quote.status === 'accepted' && (
                    <View style={styles.wonBadge}>
                      <Trophy size={14} color={theme.colors.success} />
                      <Text style={styles.wonText}>Job won!</Text>
                    </View>
                  )}

                  {quote.status === 'quoted' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(quote)}>
                        <Pencil size={14} color={theme.colors.primary} />
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.withdrawBtn} onPress={() => setWithdrawTarget(quote)}>
                        <XCircle size={14} color={theme.colors.error} />
                        <Text style={styles.withdrawBtnText}>Withdraw</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Withdraw confirmation modal (cross-platform) */}
      <Modal
        visible={!!withdrawTarget}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setWithdrawTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !busy && setWithdrawTarget(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconCircle}>
                <AlertTriangle size={24} color="#DC2626" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Withdraw this quote?</Text>
            <Text style={styles.modalSubtitle}>
              Your quote will be removed and the customer notified. The $0.50 unlock fee is not
              refunded. This can't be undone.
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalGoBackBtn} onPress={() => !busy && setWithdrawTarget(null)}>
                <Text style={styles.modalGoBackBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmWithdraw}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Withdraw</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.xxl : theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  quoteCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  tradeType: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  postcode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium as any,
  },
  cardBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  wonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  wonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.success,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF',
  },
  editBtnText: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.primary },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
    backgroundColor: '#FFF',
  },
  withdrawBtnText: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.error },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  modalIconRow: { alignItems: 'center', marginBottom: 12 },
  modalIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalButtonRow: { flexDirection: 'row', gap: 12 },
  modalGoBackBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#FFF' },
  modalGoBackBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC2626' },
  modalConfirmBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
