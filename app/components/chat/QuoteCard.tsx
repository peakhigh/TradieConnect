import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable, TextInput } from 'react-native';
import { theme } from '../../theme/theme';
import { DollarSign, Clock, FileText, CheckCircle, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { runCloudFunction } from '../../services/cloudFunctions';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [error, setError] = useState<string | null>(null);

  const handleAcceptConfirm = async () => {
    if (!address.trim()) {
      setError('Please enter the job address so the tradie can reach the site.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a contact phone number.');
      return;
    }
    setError(null);
    setLoading('accept');
    try {
      await runCloudFunction('acceptQuote', {
        quoteId: quoteData.quoteId,
        customerAddress: address.trim(),
        customerPhone: phone.trim(),
      });
      setShowAcceptModal(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to accept quote');
    } finally {
      setLoading(null);
    }
  };

  const handleDeclineConfirm = async () => {
    setLoading('decline');
    try {
      await runCloudFunction('declineQuote', { quoteId: quoteData.quoteId });
      setShowDeclineModal(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to decline quote');
    } finally {
      setLoading(null);
    }
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
            style={styles.declineButton}
            onPress={() => { setError(null); setShowDeclineModal(true); }}
            disabled={!!loading}
          >
            <XCircle size={16} color={theme.colors.error} />
            <Text style={styles.declineText}>Not Interested</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => { setError(null); setPhone(user?.phoneNumber || ''); setShowAcceptModal(true); }}
            disabled={!!loading}
          >
            <CheckCircle size={16} color="#ffffff" />
            <Text style={styles.acceptText}>Accept Quote</Text>
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

      {/* Accept Modal — collects address/phone then accepts */}
      <Modal visible={showAcceptModal} transparent animationType="fade" onRequestClose={() => !loading && setShowAcceptModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !loading && setShowAcceptModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <CheckCircle2 size={24} color="#059669" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Accept Quote</Text>
            <Text style={styles.modalSubtitle}>
              Accept this <Text style={styles.modalBold}>${quoteData.totalPrice.toFixed(2)}</Text> quote from{' '}
              <Text style={styles.modalBold}>{quoteData.tradieName}</Text>. Your contact details below will be shared so they can start the job.
            </Text>

            <Text style={styles.fieldLabel}>Job Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 12 Smith St, Bondi NSW 2026"
              placeholderTextColor={theme.colors.text.tertiary}
            />
            <Text style={styles.fieldLabel}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="04xx xxx xxx"
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="phone-pad"
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalGoBackBtn} onPress={() => setShowAcceptModal(false)} disabled={!!loading}>
                <Text style={styles.modalGoBackBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#059669' }, loading === 'accept' && styles.buttonDisabled]} onPress={handleAcceptConfirm} disabled={loading === 'accept'}>
                {loading === 'accept' ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalConfirmBtnText}>Accept &amp; Share</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Decline Modal */}
      <Modal visible={showDeclineModal} transparent animationType="fade" onRequestClose={() => !loading && setShowDeclineModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !loading && setShowDeclineModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <AlertTriangle size={24} color="#D97706" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Not Interested</Text>
            <Text style={styles.modalSubtitle}>
              Decline this quote from <Text style={styles.modalBold}>{quoteData.tradieName}</Text>? They will be notified. You can still accept other quotes.
            </Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalGoBackBtn} onPress={() => setShowDeclineModal(false)} disabled={!!loading}>
                <Text style={styles.modalGoBackBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#D97706' }, loading === 'decline' && styles.buttonDisabled]} onPress={handleDeclineConfirm} disabled={loading === 'decline'}>
                {loading === 'decline' ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalConfirmBtnText}>Yes, Decline</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  // Modal
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
  modalBold: { fontWeight: '700', color: '#1F2937' },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
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
  },
  modalConfirmBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
