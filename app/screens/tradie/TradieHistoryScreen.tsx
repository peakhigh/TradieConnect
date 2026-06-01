import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Container } from '../../components/UI/Container';
import { EmptyState } from '../../components/UI/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useFetchDocs } from '../../hooks/useFetchDocs';
import { theme } from '../../theme/theme';
import { Calendar, DollarSign, Trophy } from 'lucide-react-native';
import { formatCurrency, timestampToReadable } from '../../utils/helpers';

interface QuoteDoc {
  id: string;
  serviceRequestId: string;
  tradieId: string;
  amount?: number;
  totalPrice?: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  tradeType?: string;
  trades?: string[];
  postcode?: string;
  suburb?: string;
}

export default function TradieHistoryScreen() {
  const { user } = useAuth();

  const { documents: quotes, loading } = useFetchDocs<QuoteDoc>({
    collectionName: 'quotes',
    wheres: [['tradieId', '==', user?.id || '']],
    orderBys: [['createdAt', 'desc']],
    limitCount: 30,
    subscribe: false,
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
        return 'Quoted';
      default:
        return status;
    }
  };

  return (
    <Container scrollable={false} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Quote History</Text>
            <Text style={styles.subtitle}>All quotes you have submitted</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
          ) : quotes.length === 0 ? (
            <EmptyState
              title="No Quotes Yet"
              message="Quotes you submit will appear here. Start exploring service requests!"
            />
          ) : (
            quotes.map((quote) => {
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
                </View>
              );
            })
          )}
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
});
