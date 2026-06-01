import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Container } from '../../components/UI/Container';
import { SimpleButton } from '../../components/UI/SimpleButton';
import { EmptyState } from '../../components/UI/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useFetchDocs } from '../../hooks/useFetchDocs';
import { runCloudFunction } from '../../services/cloudFunctions';
import { theme } from '../../theme/theme';
import { Wallet, Plus, Minus, Gift, ArrowDownCircle } from 'lucide-react-native';
import { formatCurrency, timestampToReadable } from '../../utils/helpers';
import { WalletTransaction } from '../../types';

export default function WalletScreen() {
  const { user, refreshUser } = useAuth();
  const [recharging, setRecharging] = useState(false);

  const { documents: transactions, loading, refresh } = useFetchDocs<WalletTransaction>({
    collectionName: 'walletTransactions',
    wheres: [['userId', '==', user?.id || '']],
    orderBys: [['createdAt', 'desc']],
    limitCount: 20,
    subscribe: false,
  });

  const handleRecharge = async () => {
    setRecharging(true);
    try {
      await runCloudFunction('rechargeWallet', { amount: 10 });
      await refreshUser();
      refresh();
    } catch (error) {
      console.error('Recharge error:', error);
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
              title="Recharge $10"
              onPress={handleRecharge}
              loading={recharging}
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
});
