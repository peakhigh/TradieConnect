import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { Container } from '../../components/UI/Container';
import { SimpleButton } from '../../components/UI/SimpleButton';
import { EmptyState } from '../../components/UI/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useFetchDocs } from '../../hooks/useFetchDocs';
import { rechargeWalletFlow, completeWebCheckoutIfReturning } from '../../services/payments';
import { theme } from '../../theme/theme';
import { Wallet, Plus, Minus, Gift, ArrowDownCircle } from 'lucide-react-native';
import { formatCurrency, timestampToReadable } from '../../utils/helpers';
import { WalletTransaction } from '../../types';

export default function WalletScreen() {
  const { user, refreshUser } = useAuth();
  const [recharging, setRecharging] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [rechargeError, setRechargeError] = useState<string | null>(null);

  const RECHARGE_OPTIONS = [5, 10, 20, 50];
  const MIN_RECHARGE = 5;

  const { documents: transactions, loading, refresh } = useFetchDocs<WalletTransaction>({
    collectionName: 'walletTransactions',
    wheres: [['userId', '==', user?.id || '']],
    orderBys: [['createdAt', 'desc']],
    limitCount: 20,
    subscribe: false,
  });

  // If we've just returned from Stripe-hosted Checkout (web), confirm + credit.
  useEffect(() => {
    let active = true;
    completeWebCheckoutIfReturning()
      .then(async (newBalance) => {
        if (active && newBalance != null) {
          await refreshUser();
          refresh();
        }
      })
      .catch((e: any) => {
        if (active) setRechargeError(e?.message || 'Could not confirm payment.');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveAmount = (): number => {
    if (customAmount.trim()) {
      const parsed = parseFloat(customAmount);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return selectedAmount;
  };

  const handleRecharge = async () => {
    const amount = resolveAmount();
    if (!amount || amount < MIN_RECHARGE) {
      setRechargeError(`Minimum recharge is $${MIN_RECHARGE.toFixed(2)}.`);
      return;
    }
    setRechargeError(null);
    setRecharging(true);
    try {
      const result = await rechargeWalletFlow(amount);
      if (result.redirecting) {
        // Web: browser is navigating to Stripe Checkout; nothing more to do here.
        return;
      }
      if (result.cancelled) {
        setRechargeError('Payment cancelled.');
        return;
      }
      await refreshUser();
      refresh();
      setShowRechargeModal(false);
      setCustomAmount('');
    } catch (error: any) {
      setRechargeError(error?.message || 'Recharge failed. Please try again.');
    } finally {
      setRecharging(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return <Plus size={18} color={theme.colors.success} />;
      case 'unlock':
        return <Minus size={18} color={theme.colors.error} />;
      case 'bonus':
        return <Gift size={18} color={theme.colors.primary} />;
      default:
        return <ArrowDownCircle size={18} color={theme.colors.text.secondary} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'recharge':
        return theme.colors.success;
      case 'unlock':
        return theme.colors.error;
      case 'bonus':
        return theme.colors.primary;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'recharge':
      case 'bonus':
        return '+';
      case 'unlock':
        return '-';
      default:
        return '';
    }
  };

  const walletBalance = (user as any)?.walletBalance ?? 0;

  return (
    <Container scrollable={false} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Wallet size={32} color={theme.colors.primary} />
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(walletBalance)}</Text>
            <SimpleButton
              title="Recharge Wallet"
              onPress={() => { setRechargeError(null); setShowRechargeModal(true); }}
              style={styles.rechargeButton}
              size="medium"
            />
          </View>

          {/* Transaction History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : transactions.length === 0 ? (
              <EmptyState
                title="No Transactions"
                message="Your wallet transactions will appear here."
              />
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionCard}>
                  <View style={styles.transactionIcon}>
                    {getTransactionIcon(tx.type)}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      {tx.description || tx.type}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {timestampToReadable((tx as any).createdAt || tx.timestamp)}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: getTransactionColor(tx.type) }]}>
                    {getAmountPrefix(tx.type)}{formatCurrency(Math.abs(tx.amount))}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Recharge Modal */}
      <Modal visible={showRechargeModal} transparent animationType="fade" onRequestClose={() => !recharging && setShowRechargeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !recharging && setShowRechargeModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconCircle}>
                <Wallet size={24} color={theme.colors.primary} />
              </View>
            </View>
            <Text style={styles.modalTitle}>Recharge Wallet</Text>
            <Text style={styles.modalSubtitle}>
              Choose an amount to add to your wallet. Minimum ${MIN_RECHARGE.toFixed(2)}.
            </Text>

            <View style={styles.amountGrid}>
              {RECHARGE_OPTIONS.map((amt) => {
                const active = !customAmount.trim() && selectedAmount === amt;
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.amountOption, active && styles.amountOptionActive]}
                    onPress={() => { setSelectedAmount(amt); setCustomAmount(''); setRechargeError(null); }}
                  >
                    <Text style={[styles.amountOptionText, active && styles.amountOptionTextActive]}>${amt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Or enter a custom amount</Text>
            <TextInput
              style={styles.input}
              value={customAmount}
              onChangeText={(t) => { setCustomAmount(t); setRechargeError(null); }}
              placeholder={`e.g. 25 (min $${MIN_RECHARGE})`}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="decimal-pad"
            />

            {rechargeError && <Text style={styles.errorText}>{rechargeError}</Text>}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalGoBackBtn} onPress={() => setShowRechargeModal(false)} disabled={recharging}>
                <Text style={styles.modalGoBackBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, recharging && { opacity: 0.6 }]} onPress={handleRecharge} disabled={recharging}>
                {recharging ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Recharge ${resolveAmount() || 0}</Text>
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
  balanceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.md,
  },
  balanceLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  balanceAmount: {
    fontSize: Platform.OS === 'web' ? 40 : 32,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginVertical: theme.spacing.md,
  },
  rechargeButton: {
    marginTop: theme.spacing.md,
    minWidth: 160,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium as any,
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
  },
  // Recharge modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconRow: { alignItems: 'center', marginBottom: 12 },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amountOption: {
    flexGrow: 1,
    flexBasis: '22%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  amountOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  amountOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  amountOptionTextActive: {
    color: theme.colors.primary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalButtonRow: { flexDirection: 'row', gap: 12 },
  modalGoBackBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  modalGoBackBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  modalConfirmBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
