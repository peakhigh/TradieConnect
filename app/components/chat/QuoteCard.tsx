import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../theme/theme';
import { DollarSign, Clock, FileText, CheckCircle, XCircle } from 'lucide-react-native';
import { functions, httpsCallable } from '../../services/firebase';

interface QuoteData {
  quoteId: string;
  totalPrice: number;
  materialsCost: number;
  laborCost: number;
  timelineDays: number;
  estimatedStartDate: string | null;
  estimatedCompletionDate: string | null;
  notes: string | null;
  tradieName: string;
  tradieRating: number;
  trades: string[];
  postcode: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface QuoteCardProps {
  quoteData: QuoteData;
  chatRoomId: string;
  isCustomer: boolean;
}

export default function QuoteCard({ quoteData, chatRoomId, isCustomer }: QuoteCardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAccept = async () => {
    Alert.alert(
      'Accept Quote',
      `Accept this $${quoteData.totalPrice.toFixed(2)} quote from ${quoteData.tradieName}? Your contact details will be shared.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setLoading('accept');
            try {
              const acceptFn = httpsCallable(functions, 'acceptQuote');
              await acceptFn({
                quoteId: quoteData.quoteId,
                customerAddress: '', // TODO: get from user profile
                customerPhone: '',
              });
              Alert.alert('Success', 'Quote accepted! You can now chat freely.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept quote');
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Not Interested',
      'Are you sure? The tradie will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setLoading('decline');
            // TODO: Implement decline Cloud Function
            setTimeout(() => setLoading(null), 1000);
          },
        },
      ]
    );
  };

  const isAccepted = quoteData.status === 'accepted';
  const isRejected = quoteData.status === 'rejected';
  const isPending = quoteData.status === 'pending';

  return (
    <View style={styles.container}>
      {/* Quote Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <DollarSign size={16} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Quote</Text>
        </View>
        <View style={[
          styles.statusBadge,
          isAccepted && styles.statusAccepted,
          isRejected && styles.statusRejected,
          isPending && styles.statusPending,
        ]}>
          <Text style={[
            styles.statusText,
            isAccepted && styles.statusTextAccepted,
            isRejected && styles.statusTextRejected,
          ]}>
            {isAccepted ? 'Accepted' : isRejected ? 'Declined' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Trade & Location */}
      <Text style={styles.tradeText}>
        {quoteData.trades?.join(', ') || 'Service'} • {quoteData.postcode}
      </Text>

      {/* Price */}
      <View style={styles.priceSection}>
        <Text style={styles.priceLabel}>Total Price</Text>
        <Text style={styles.priceValue}>${quoteData.totalPrice.toFixed(2)}</Text>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Materials</Text>
          <Text style={styles.breakdownValue}>${quoteData.materialsCost.toFixed(2)}</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Labor</Text>
          <Text style={styles.breakdownValue}>${quoteData.laborCost.toFixed(2)}</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Timeline</Text>
          <Text style={styles.breakdownValue}>{quoteData.timelineDays} days</Text>
        </View>
      </View>

      {/* Notes */}
      {quoteData.notes && (
        <View style={styles.notesSection}>
          <FileText size={12} color={theme.colors.text.secondary} />
          <Text style={styles.notesText}>{quoteData.notes}</Text>
        </View>
      )}

      {/* Tradie Info */}
      <View style={styles.tradieInfo}>
        <Text style={styles.tradieName}>{quoteData.tradieName}</Text>
        {quoteData.tradieRating > 0 && (
          <Text style={styles.tradieRating}>⭐ {quoteData.tradieRating.toFixed(1)}</Text>
        )}
      </View>

      {/* Action Buttons (Customer only, pending only) */}
      {isCustomer && isPending && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.declineButton, loading === 'decline' && styles.buttonDisabled]}
            onPress={handleDecline}
            disabled={!!loading}
          >
            {loading === 'decline' ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <>
                <XCircle size={16} color={theme.colors.error} />
                <Text style={styles.declineText}>Not Interested</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, loading === 'accept' && styles.buttonDisabled]}
            onPress={handleAccept}
            disabled={!!loading}
          >
            {loading === 'accept' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <CheckCircle size={16} color="#ffffff" />
                <Text style={styles.acceptText}>Accept Quote</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Tradie sees waiting state */}
      {!isCustomer && isPending && (
        <View style={styles.waitingRow}>
          <Clock size={14} color={theme.colors.text.tertiary} />
          <Text style={styles.waitingText}>Waiting for customer response...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  statusAccepted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  statusTextAccepted: {
    color: '#065F46',
  },
  statusTextRejected: {
    color: '#991B1B',
  },
  tradeText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  priceLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  breakdownRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: theme.colors.surfaceSecondary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  tradieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tradieName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  tradieRating: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.success,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  declineText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  waitingText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
});
