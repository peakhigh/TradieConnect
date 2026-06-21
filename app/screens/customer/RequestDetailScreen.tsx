import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
} from 'firebase/firestore';
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Star,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { Container } from '../../components/UI/Container';
import { StatusBadge } from '../../components/UI/StatusBadge';
import { CompleteJobModal } from '../../components/customer/CompleteJobModal';
import { theme } from '../../theme/theme';
import { db } from '../../services/firebase';
import { runCloudFunction } from '../../services/cloudFunctions';
import { useAuth } from '../../context/AuthContext';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { ServiceRequest, Quote, ServiceRequestStatus } from '../../types';

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

// A quote is awaiting the customer's decision when it carries a real price
// and hasn't been accepted/rejected yet. Seed + submitQuote use 'quoted';
// older docs may use 'pending'.
const isActionable = (status: Quote['status']) => status === 'quoted' || status === 'pending';

export default function RequestDetailScreen({ requestId: requestIdProp }: { requestId?: string } = {}) {
  const requestId = requestIdProp;
  const { user } = useAuth();
  const navigation = useScreenNavigation();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // Accept modal state
  const [acceptTarget, setAcceptTarget] = useState<Quote | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Quote | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Subscribe to the request doc ---
  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'serviceRequests', requestId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setRequest({
            id: snap.id,
            ...data,
            createdAt: toDate(data.createdAt) || new Date(),
            updatedAt: toDate(data.updatedAt) || new Date(),
          } as unknown as ServiceRequest);
        } else {
          setRequest(null);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [requestId]);

  // --- Subscribe to this request's quotes ---
  useEffect(() => {
    if (!requestId) return;
    const q = query(collection(db, 'quotes'), where('serviceRequestId', '==', requestId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            serviceRequestId: data.serviceRequestId || '',
            tradieId: data.tradieId || '',
            tradieName: data.tradieName || 'Tradie',
            tradieRating: data.tradieRating || 0,
            totalPrice: data.totalPrice || 0,
            materialsCost: data.materialsCost || 0,
            laborCost: data.laborCost || 0,
            timelineDays: data.timelineDays || 0,
            estimatedStartDate: toDate(data.estimatedStartDate),
            estimatedCompletionDate: toDate(data.estimatedCompletionDate),
            notes: data.notes || '',
            status: data.status,
            quotedAt: toDate(data.quotedAt) || undefined,
            createdAt: toDate(data.quotedAt) || toDate(data.createdAt) || new Date(),
          } as Quote;
        })
        // Only show quotes the tradie has actually submitted (skip 'unlocked' placeholders)
        .filter((qt) => qt.status !== 'unlocked')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setQuotes(list);
    });
    return unsub;
  }, [requestId]);

  const status = (request?.status || 'new') as ServiceRequestStatus;
  const isOpenForQuotes = status === 'new' || status === 'quoted';
  const isAssigned = status === 'assigned';
  const tradeLabel = request?.trades?.join(', ') || request?.tradeType || 'Service';

  // --- Actions ---
  const openAccept = (quote: Quote) => {
    setError(null);
    setAddress(request?.customerAddress || '');
    setPhone(user?.phoneNumber || '');
    setAcceptTarget(quote);
  };

  const handleAcceptConfirm = async () => {
    if (!acceptTarget) return;
    if (!address.trim()) {
      setError('Please enter the job address so the tradie can reach the site.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a contact phone number.');
      return;
    }
    setError(null);
    setBusy('accept');
    try {
      await runCloudFunction('acceptQuote', {
        quoteId: acceptTarget.id,
        customerAddress: address.trim(),
        customerPhone: phone.trim(),
      });
      setAcceptTarget(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to accept quote');
    } finally {
      setBusy(null);
    }
  };

  const handleDeclineConfirm = async () => {
    if (!declineTarget) return;
    setError(null);
    setBusy('decline');
    try {
      await runCloudFunction('declineQuote', { quoteId: declineTarget.id });
      setDeclineTarget(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to decline quote');
    } finally {
      setBusy(null);
    }
  };

  const handleCancelConfirm = async () => {
    if (!requestId) return;
    setError(null);
    setBusy('cancel');
    try {
      const { doc: docRef, updateDoc } = await import('firebase/firestore');
      await updateDoc(docRef(db, 'serviceRequests', requestId), {
        status: 'cancelled',
        updatedAt: new Date(),
      });
      setShowCancel(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel request');
    } finally {
      setBusy(null);
    }
  };

  // --- Render ---
  if (!requestId) {
    return (
      <Container style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No request selected.</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={theme.colors.text.secondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
        ) : !request ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Request not found.</Text>
          </View>
        ) : (
          <>
            {/* Request summary */}
            <View style={styles.card}>
              <View style={styles.summaryHeader}>
                <Text style={styles.tradeLabel}>{tradeLabel}</Text>
                <StatusBadge status={status} userType="customer" size="medium" />
              </View>
              {!!request.postcode && <Text style={styles.meta}>Postcode {request.postcode}</Text>}
              {!!request.description && <Text style={styles.description}>{request.description}</Text>}
              <Text style={styles.meta}>Posted {request.createdAt.toLocaleDateString()}</Text>

              {isAssigned && (
                <TouchableOpacity style={styles.completeBtn} onPress={() => setShowComplete(true)}>
                  <CheckCircle2 size={18} color="#FFF" />
                  <Text style={styles.completeBtnText}>Mark Job Complete</Text>
                </TouchableOpacity>
              )}
              {isOpenForQuotes && (
                <TouchableOpacity style={styles.cancelLink} onPress={() => setShowCancel(true)}>
                  <Text style={styles.cancelLinkText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Quotes */}
            <Text style={styles.sectionTitle}>Quotes ({quotes.length})</Text>

            {quotes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No quotes yet. Tradies who unlock your request will appear here.
                </Text>
              </View>
            ) : (
              quotes.map((quote) => {
                const accepted = quote.status === 'accepted';
                const rejected = quote.status === 'rejected';
                const canAct = isOpenForQuotes && isActionable(quote.status);
                return (
                  <View
                    key={quote.id}
                    style={[styles.quoteCard, accepted && styles.quoteCardAccepted]}
                  >
                    <View style={styles.quoteHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tradieName}>{quote.tradieName}</Text>
                        {(quote.tradieRating || 0) > 0 && (
                          <View style={styles.ratingRow}>
                            <Star size={13} color="#fbbf24" fill="#fbbf24" />
                            <Text style={styles.ratingText}>{quote.tradieRating?.toFixed(1)}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.price}>${(quote.totalPrice || 0).toFixed(2)}</Text>
                    </View>

                    <View style={styles.breakdownRow}>
                      <View style={styles.breakItem}>
                        <DollarSign size={14} color={theme.colors.text.tertiary} />
                        <Text style={styles.breakText}>
                          Materials ${(quote.materialsCost || 0).toFixed(0)} · Labour $
                          {(quote.laborCost || 0).toFixed(0)}
                        </Text>
                      </View>
                      {(quote.timelineDays || 0) > 0 && (
                        <View style={styles.breakItem}>
                          <Clock size={14} color={theme.colors.text.tertiary} />
                          <Text style={styles.breakText}>
                            {quote.timelineDays} day{quote.timelineDays! > 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}
                    </View>

                    {!!quote.notes && (
                      <View style={styles.notesRow}>
                        <FileText size={14} color={theme.colors.text.tertiary} />
                        <Text style={styles.notesText}>{quote.notes}</Text>
                      </View>
                    )}

                    {accepted && (
                      <View style={[styles.tagPill, styles.tagAccepted]}>
                        <CheckCircle2 size={14} color="#059669" />
                        <Text style={[styles.tagText, { color: '#059669' }]}>Accepted</Text>
                      </View>
                    )}
                    {rejected && (
                      <View style={[styles.tagPill, styles.tagRejected]}>
                        <XCircle size={14} color="#DC2626" />
                        <Text style={[styles.tagText, { color: '#DC2626' }]}>Declined</Text>
                      </View>
                    )}

                    {canAct && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.declineBtn}
                          onPress={() => {
                            setError(null);
                            setDeclineTarget(quote);
                          }}
                        >
                          <Text style={styles.declineBtnText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => openAccept(quote)}>
                          <Text style={styles.acceptBtnText}>Accept Quote</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Accept modal — collect address + phone */}
      <Modal
        visible={!!acceptTarget}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setAcceptTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !busy && setAcceptTarget(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <CheckCircle2 size={24} color="#059669" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Accept this quote?</Text>
            <Text style={styles.modalSubtitle}>
              Accepting <Text style={styles.bold}>{acceptTarget?.tradieName}</Text>'s $
              {(acceptTarget?.totalPrice || 0).toFixed(2)} quote shares your address and phone so they
              can start. Other quotes will be declined.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Job address"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact phone"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalGoBackBtn}
                onPress={() => !busy && setAcceptTarget(null)}
              >
                <Text style={styles.modalGoBackBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#059669' }]}
                onPress={handleAcceptConfirm}
                disabled={busy === 'accept'}
              >
                {busy === 'accept' ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Decline confirm modal */}
      <Modal
        visible={!!declineTarget}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setDeclineTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !busy && setDeclineTarget(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <AlertTriangle size={24} color="#DC2626" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Decline this quote?</Text>
            <Text style={styles.modalSubtitle}>
              You're about to decline <Text style={styles.bold}>{declineTarget?.tradieName}</Text>'s
              quote. They'll be notified. This can't be undone.
            </Text>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalGoBackBtn}
                onPress={() => !busy && setDeclineTarget(null)}
              >
                <Text style={styles.modalGoBackBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleDeclineConfirm}
                disabled={busy === 'decline'}
              >
                {busy === 'decline' ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Cancel request confirm modal */}
      <Modal
        visible={showCancel}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setShowCancel(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !busy && setShowCancel(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <AlertTriangle size={24} color="#DC2626" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Cancel this request?</Text>
            <Text style={styles.modalSubtitle}>
              This will cancel your <Text style={styles.bold}>{tradeLabel}</Text> request. Tradies will
              no longer be able to quote on it. This can't be undone.
            </Text>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalGoBackBtn}
                onPress={() => !busy && setShowCancel(false)}
              >
                <Text style={styles.modalGoBackBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleCancelConfirm}
                disabled={busy === 'cancel'}
              >
                {busy === 'cancel' ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Cancel Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Complete job modal (rate tradie) */}
      <CompleteJobModal
        visible={showComplete}
        onClose={() => setShowComplete(false)}
        serviceRequestId={requestId}
        tradeLabel={tradeLabel}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingVertical: 8 },
  backButtonText: { fontSize: 16, color: theme.colors.text.secondary },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tradeLabel: { fontSize: Platform.OS === 'web' ? 22 : 18, fontWeight: '700', color: theme.colors.text.primary, flex: 1, marginRight: 8 },
  description: { fontSize: 15, color: theme.colors.text.secondary, lineHeight: 21, marginVertical: 8 },
  meta: { fontSize: 13, color: theme.colors.text.tertiary, marginTop: 2 },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#059669', paddingVertical: 12, borderRadius: 8, marginTop: 16,
  },
  completeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  cancelLink: { alignItems: 'center', marginTop: 14, paddingVertical: 6 },
  cancelLinkText: { color: '#DC2626', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: Platform.OS === 'web' ? 20 : 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 12 },
  quoteCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12,
  },
  quoteCardAccepted: { borderColor: '#059669', backgroundColor: '#F0FDF4' },
  quoteHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tradieName: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 13, color: theme.colors.text.secondary },
  price: { fontSize: 20, fontWeight: '700', color: theme.colors.primary },
  breakdownRow: { gap: 6, marginBottom: 8 },
  breakItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakText: { fontSize: 13, color: theme.colors.text.secondary },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
  notesText: { fontSize: 14, color: theme.colors.text.secondary, flex: 1, lineHeight: 20 },
  tagPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  tagAccepted: { backgroundColor: '#D1FAE5' },
  tagRejected: { backgroundColor: '#FEE2E2' },
  tagText: { fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  declineBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#FFF' },
  declineBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  acceptBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center', backgroundColor: '#059669' },
  acceptBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  emptyState: { backgroundColor: '#FFF', borderRadius: 8, padding: 24, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  emptyText: { color: '#6b7280', textAlign: 'center' },
  // Modal (cross-platform pattern)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  modalIconRow: { alignItems: 'center', marginBottom: 12 },
  modalIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  bold: { fontWeight: '700', color: '#1F2937' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1F2937', marginBottom: 10 },
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  modalButtonRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  modalGoBackBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#FFF' },
  modalGoBackBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalConfirmBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
