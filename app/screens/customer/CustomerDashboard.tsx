import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform, Modal } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { Sparkles, MessageCircle, Plus } from 'lucide-react-native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { SkeletonLoader } from '../../components/UI/SkeletonLoader';
import { RequestDetailsDrawer } from '../../components/UI/RequestDetailsDrawer';
import { VoicePlayer } from '../../components/UI/VoicePlayer';

export default function CustomerDashboard() {
  const { user, successMessage, clearSuccessMessage } = useAuth();
  const { serviceRequests, quotes, unreadMessageCount } = useUser();
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (successMessage) {
      Alert.alert('Success', successMessage);
      clearSuccessMessage();
    }
  }, [successMessage, clearSuccessMessage]);

  const activeRequests = serviceRequests.filter(req => req.status === 'active');
  const completedRequests = serviceRequests.filter(req => req.status === 'completed');

  const handleViewInterests = (requestId: string) => {
    navigation.navigate('Interests', { requestId });
  };

  const handleViewMessages = (requestId?: string) => {
    navigation.navigate('Messages', { requestId });
  };

  const handleCancelRequest = (requestId: string) => {
    setRequestToCancel(requestId);
    setShowCancelModal(true);
  };
  
  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;
    
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      
      await updateDoc(doc(db, 'serviceRequests', requestToCancel), {
        status: 'cancelled',
        updatedAt: new Date()
      });
      
      setShowCancelModal(false);
      setRequestToCancel(null);
    } catch (error) {
      console.error('Error cancelling request:', error);
      Alert.alert('Error', 'Failed to cancel request');
    }
  };
  
  const handleViewRequestDetails = (request: any) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };
  


  const handleChatWithTradie = (tradieId: string) => {
    Alert.alert('Info', 'Chat functionality coming soon');
  };

  const handleAcceptQuote = (quoteId: string) => {
    Alert.alert('Info', 'Quote acceptance functionality coming soon');
  };

  const navigation = useNavigation();

  const handlePostRequest = () => {
    navigation.navigate('PostRequest' as never);
  };

  return (
    <Container style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                <Sparkles size={24} color={theme.colors.primary} /> Welcome back, {user?.firstName}!
              </Text>
              <Text style={styles.subtitle}>
                Here's what's happening with your service requests
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity onPress={handlePostRequest} style={styles.linkButton}>
            <Plus size={20} color={theme.colors.primary} />
            <Text style={styles.linkButtonText}>New Service Request</Text>
          </TouchableOpacity>
        </View>

        {/* Messages Notification */}
        {unreadMessageCount > 0 && (
          <TouchableOpacity
            style={styles.messageNotification}
            onPress={handleViewMessages}
          >
            <Text style={styles.messageTitle}>
              You have {unreadMessageCount} new message{unreadMessageCount > 1 ? 's' : ''}
            </Text>
            <Text style={styles.messageSubtitle}>
              Tap to view messages
            </Text>
          </TouchableOpacity>
        )}

        {/* Active Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Active Requests ({loading ? '...' : activeRequests.length})
          </Text>
          
          {loading ? (
            <SkeletonLoader type="card" count={2} />
          ) : activeRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No active requests. Post a new request to get started!
              </Text>
            </View>
          ) : (
            activeRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <TouchableOpacity onPress={() => handleViewRequestDetails(request)}>
                  <Text style={[styles.requestTitle, styles.tradeLink]}>
                    {request.tradeType}
                  </Text>
                </TouchableOpacity>
                
                {/* Notes or Voice Message */}
                {request.voiceMessage ? (
                  <VoicePlayer voiceUrl={request.voiceMessage} compact={true} />
                ) : (
                  <Text style={styles.requestDescription} numberOfLines={1}>
                    {request.description}
                  </Text>
                )}
                
                <Text style={styles.requestMeta}>
                  Postcode: {request.postcode} • Urgency: {request.urgency}
                </Text>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    onPress={() => handleViewInterests(request.id)}
                    style={styles.cardButton}
                  >
                    <Text style={styles.cardButtonText}>Interests (0)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleViewMessages(request.id)}
                    style={styles.cardButton}
                  >
                    <Text style={styles.cardButtonText}>Messages (0)</Text>
                  </TouchableOpacity>
                  {request.status === 'active' && (
                    <TouchableOpacity 
                      onPress={() => handleCancelRequest(request.id)}
                      style={[styles.cardButton, styles.cancelButton]}
                    >
                      <Text style={[styles.cardButtonText, styles.cancelButtonText]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Quotes */}
        {quotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Recent Quotes ({quotes.length})
            </Text>
            
            {quotes.slice(0, 3).map((quote) => (
              <View key={quote.id} style={styles.quoteCard}>
                <Text style={styles.quoteTitle}>
                  ${quote.amount} - {quote.tradie.firstName} {quote.tradie.lastName}
                </Text>
                <Text style={styles.quoteNotes}>
                  {quote.notes}
                </Text>
                <Text style={styles.quoteMeta}>
                  Start: {quote.estimatedStartDate.toDateString()} • 
                  Completion: {quote.estimatedCompletionDate.toDateString()}
                </Text>
                
                <View style={styles.buttonRow}>
                  <Button
                    title="Accept Quote"
                    onPress={() => handleAcceptQuote(quote.id)}
                    size="small"
                  />
                  <Button
                    title="Chat with Tradie"
                    onPress={() => handleChatWithTradie(quote.tradieId)}
                    variant="outline"
                    size="small"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Completed Requests */}
        {completedRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Completed Requests ({completedRequests.length})
            </Text>
            
            {completedRequests.slice(0, 3).map((request) => (
              <View key={request.id} style={styles.completedCard}>
                <Text style={styles.completedTitle}>
                  {request.tradeType}
                </Text>
                <Text style={styles.completedDescription}>
                  {request.description}
                </Text>
                <Text style={styles.completedMeta}>
                  Postcode: {request.postcode || 'Not set'} • Completed on {request.updatedAt instanceof Date ? request.updatedAt.toDateString() : 'Unknown date'}
                </Text>
                
                {request.preferredDates && (
                  <Text style={styles.completedMeta}>
                    Preferred: {request.preferredDates.earliest instanceof Date ? request.preferredDates.earliest.toDateString() : 'Not set'} - {request.preferredDates.latest instanceof Date ? request.preferredDates.latest.toDateString() : 'Not set'}
                  </Text>
                )}
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cardButton}>
                    <Text style={styles.cardButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cardButton}>
                    <Text style={styles.cardButtonText}>Repost</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Request</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this service request? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmCancelRequest}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <RequestDetailsDrawer
        visible={showRequestDetails}
        onClose={() => setShowRequestDetails(false)}
        request={selectedRequest}
      />
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
  messageNotification: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  messageTitle: {
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageSubtitle: {
    color: '#2563eb',
    fontSize: 14,
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
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.lg : theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  requestDescription: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.md : theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  requestMeta: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.sm : 11,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
  },
  quoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  quoteNotes: {
    color: '#6b7280',
    marginBottom: 8,
  },
  quoteMeta: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  completedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  completedDescription: {
    color: '#6b7280',
    marginBottom: 8,
  },
  completedMeta: {
    fontSize: 14,
    color: '#9ca3af',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    flex: 1,
  },
  cardButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  cardButtonText: {
    color: theme.colors.primary,
    fontSize: Platform.OS === 'web' ? theme.fontSize.sm : 11,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#dc2626',
  },
  tradeLink: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  voiceMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  voiceMessageText: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.sm : 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  voicePlayingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  voiceProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  voiceProgressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  stopButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#dc2626',
    borderRadius: 4,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelModalButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});