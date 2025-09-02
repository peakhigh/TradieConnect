import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform, Modal, Image } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { createCursorStyle, createTextDecoration } from '../../theme/crossPlatform';
import { Sparkles, MessageCircle, Plus } from 'lucide-react-native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { SkeletonLoader } from '../../components/UI/SkeletonLoader';
import { RequestDetailsDrawer } from '../../components/UI/RequestDetailsDrawer';

import { PhotoModal } from '../../components/UI/PhotoModal';
import { ThumbnailImage } from '../../components/UI/ThumbnailImage';
import { RequestCard } from '../../components/UI/RequestCard';
import { ImageViewer } from '../../components/UI/ImageViewer';
import { ResultsHeader } from '../../components/UI/ResultsHeader';

export default function CustomerDashboard() {
  const { user, successMessage, clearSuccessMessage } = useAuth();
  const { serviceRequests, quotes, unreadMessageCount } = useUser();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedRequestPhotos, setSelectedRequestPhotos] = useState<string[]>([]);
  const [showDocuments, setShowDocuments] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<{requestId: string, type: string} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const PAGE_SIZE = 5;


  
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
  
  // Pagination for active requests
  const totalActiveRequests = activeRequests.length;
  const totalPages = Math.ceil(totalActiveRequests / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedActiveRequests = activeRequests.slice(startIndex, endIndex);

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

  const handlePostRequest = () => {
    navigation.navigate('PostRequest' as never);
  };

  const handleEditRequest = (requestId: string) => {
    navigation.navigate('PostRequest' as never, { editRequestId: requestId });
  };

  return (
    <Container style={styles.container}>
      <View style={styles.content}>

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                <Sparkles size={24} color={theme.colors.primary} /> Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
              </Text>
              <Text style={styles.subtitle}>
                Here's what's happening with your service requests
              </Text>
            </View>
          </View>
        </View>


        <View style={styles.quickActions}>
          <TouchableOpacity onPress={handlePostRequest} style={styles.linkButton}>
            <Plus size={20} color={theme.colors.primary} />
            <Text style={styles.linkButtonText}>New Service Request</Text>
          </TouchableOpacity>
        </View>


        {unreadMessageCount > 0 ? (
          <TouchableOpacity
            style={styles.messageNotification}
            onPress={handleViewMessages}
          >
            <Text style={styles.messageTitle}>
              You have {unreadMessageCount.toString()} new message{unreadMessageCount > 1 ? 's' : ''}
            </Text>
            <Text style={styles.messageSubtitle}>
              Tap to view messages
            </Text>
          </TouchableOpacity>
        ) : null}


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Active Requests ({loading ? '...' : activeRequests.length.toString()})
          </Text>
          
          {!loading && totalActiveRequests > 0 ? (
            <ResultsHeader
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalActiveRequests}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          ) : null}
          
          {loading ? (
            <SkeletonLoader type="card" count={2} />
          ) : activeRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No active requests. Post a new request to get started!
              </Text>
            </View>
          ) : (
            paginatedActiveRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onEdit={handleEditRequest}
                onViewDetails={handleViewRequestDetails}
                onViewInterests={handleViewInterests}
                onViewMessages={handleViewMessages}
                onCancel={handleCancelRequest}
                onPhotoPress={(photoIndex, req) => {
                  setSelectedPhotoIndex(photoIndex);
                  setSelectedRequestPhotos(req.photos || []);
                  setShowImageViewer(true);
                }}
              />
            ))
          )}
        </View>


        {quotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Recent Quotes ({quotes.length.toString()})
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


        {completedRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Completed Requests ({completedRequests.length.toString()})
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
      
      <ImageViewer
        visible={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        images={selectedRequestPhotos}
        initialIndex={selectedPhotoIndex}
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
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: '600',
    color: '#111827',    
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCountText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editIcon: {
    padding: 4,
  },
  lockIcon: {
    padding: 4,
    opacity: 0.5,
  },
  requestTitle: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.lg : theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  titleTags: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#1e40af',
  },
  requestDescription: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.md : theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  requestMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  postcodeText: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.sm : 11,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
  },
  urgencyTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  urgencyHigh: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  urgencyMedium: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  urgencyLow: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#374151',
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

  tradeLink: {
    color: theme.colors.primary,
    ...createTextDecoration('underline'),
    ...createCursorStyle('pointer'),
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
  allIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  iconButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  selectedIcon: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  iconTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  iconLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  cancelLabel: {
    color: '#dc2626',
  },
  thumbnailRow: {
    marginTop: 12,
    marginBottom: 8,
  },
  thumbnailSpacing: {
    marginRight: 6,
  },
  documentsRow: {
    marginTop: 12,
    marginBottom: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 6,
  },
  documentName: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '500',
  },
});