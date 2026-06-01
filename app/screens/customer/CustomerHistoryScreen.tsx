import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Container } from '../../components/UI/Container';
import { EmptyState } from '../../components/UI/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useFetchDocs } from '../../hooks/useFetchDocs';
import { theme } from '../../theme/theme';
import { Calendar, DollarSign, Star, MapPin } from 'lucide-react-native';
import { formatCurrency, timestampToReadable } from '../../utils/helpers';

interface ServiceRequestDoc {
  id: string;
  customerId: string;
  trades?: string[];
  tradeType?: string;
  postcode?: string;
  suburb?: string;
  status: string;
  rating?: number;
  finalPrice?: number;
  createdAt: any;
  completedAt?: any;
}

export default function CustomerHistoryScreen() {
  const { user } = useAuth();

  const { documents: requests, loading } = useFetchDocs<ServiceRequestDoc>({
    collectionName: 'serviceRequests',
    wheres: [
      ['customerId', '==', user?.id || ''],
      ['status', 'in', ['completed', 'cancelled']],
    ],
    orderBys: [['createdAt', 'desc']],
    limitCount: 30,
    subscribe: false,
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: theme.colors.success + '20', text: theme.colors.success };
      case 'cancelled':
        return { bg: theme.colors.error + '20', text: theme.colors.error };
      default:
        return { bg: theme.colors.text.secondary + '20', text: theme.colors.text.secondary };
    }
  };

  return (
    <Container scrollable={false} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Request History</Text>
            <Text style={styles.subtitle}>Your completed and cancelled requests</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
          ) : requests.length === 0 ? (
            <EmptyState
              title="No History Yet"
              message="Completed and cancelled requests will appear here."
            />
          ) : (
            requests.map((request) => {
              const statusStyle = getStatusBadgeStyle(request.status);
              const tradeDisplay = request.trades?.join(', ') || request.tradeType || 'Service';
              const locationDisplay = request.postcode || request.suburb || '';

              return (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.tradeType}>{tradeDisplay}</Text>
                      {locationDisplay ? (
                        <View style={styles.locationRow}>
                          <MapPin size={12} color={theme.colors.text.secondary} />
                          <Text style={styles.postcode}>{locationDisplay}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {request.status === 'completed' ? 'Completed' : 'Cancelled'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={theme.colors.text.secondary} />
                      <Text style={styles.metaText}>
                        {timestampToReadable(request.createdAt)}
                      </Text>
                    </View>

                    {request.status === 'completed' && request.finalPrice != null && (
                      <View style={styles.metaItem}>
                        <DollarSign size={14} color={theme.colors.success} />
                        <Text style={styles.metaText}>{formatCurrency(request.finalPrice)}</Text>
                      </View>
                    )}

                    {request.status === 'completed' && request.rating != null && (
                      <View style={styles.metaItem}>
                        <Star size={14} color={theme.colors.warning} />
                        <Text style={styles.metaText}>{request.rating}/5</Text>
                      </View>
                    )}
                  </View>
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
  requestCard: {
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  postcode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
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
});
