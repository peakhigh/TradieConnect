import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { CheckCircle2, Star } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { runCloudFunction } from '../../services/cloudFunctions';

interface CompleteJobModalProps {
  visible: boolean;
  onClose: () => void;
  serviceRequestId: string;
  tradeLabel?: string;
  onCompleted?: () => void;
}

/**
 * Cross-platform "mark job complete + rate tradie" modal.
 * Calls the real completeServiceRequest Cloud Function.
 */
export function CompleteJobModal({ visible, onClose, serviceRequestId, tradeLabel, onCompleted }: CompleteJobModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(0);
    setReview('');
    setError(null);
  };

  const handleConfirm = async () => {
    if (rating < 1) {
      setError('Please give a star rating.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await runCloudFunction('completeServiceRequest', {
        serviceRequestId,
        rating,
        review: review.trim(),
      });
      reset();
      onCompleted?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to complete the job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !submitting && onClose()}>
      <Pressable style={styles.overlay} onPress={() => !submitting && onClose()}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <CheckCircle2 size={24} color="#059669" />
            </View>
          </View>
          <Text style={styles.title}>Complete Job</Text>
          <Text style={styles.subtitle}>
            Mark your{tradeLabel ? ` ${tradeLabel}` : ''} job as completed and rate the tradie.
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => { setRating(n); setError(null); }} style={styles.starBtn}>
                <Star size={32} color="#F59E0B" fill={n <= rating ? '#F59E0B' : 'none'} />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={review}
            onChangeText={setReview}
            placeholder="Optional: leave a short review"
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            numberOfLines={3}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.goBackBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.goBackText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, submitting && { opacity: 0.6 }]} onPress={handleConfirm} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmText}>Complete &amp; Rate</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
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
  iconRow: { alignItems: 'center', marginBottom: 12 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  starBtn: { padding: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 12,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  goBackBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  goBackText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
  },
  confirmText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
