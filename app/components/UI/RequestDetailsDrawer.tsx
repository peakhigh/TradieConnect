import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions, Animated } from 'react-native';
import { X, FileText } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { VoicePlayer } from './VoicePlayer';
import { PhotoModal } from './PhotoModal';
import { ThumbnailImage } from './ThumbnailImage';

interface RequestDetailsDrawerProps {
  visible: boolean;
  onClose: () => void;
  request: any;
}

export const RequestDetailsDrawer: React.FC<RequestDetailsDrawerProps> = ({
  visible,
  onClose,
  request
}) => {
  const screenWidth = Dimensions.get('window').width;
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);


  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start();

    }
  }, [visible, slideAnim, screenWidth]);



  if (!request) return null;



  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={[styles.container, { transform: [{ translateX: slideAnim }] }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
        <View style={styles.header}>
          <Text style={styles.title}>{request.tradeType}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Notes or Voice Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            {request.voiceMessage ? (
              <VoicePlayer voiceUrl={request.voiceMessage} />
            ) : (
              <Text style={styles.description}>{request.description}</Text>
            )}
          </View>

          {/* Request Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request Information</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Postcode</Text>
                <Text style={styles.detailValue}>{request.postcode}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Urgency</Text>
                <View style={[styles.urgencyBadge, 
                  request.urgency === 'high' && styles.urgencyHigh,
                  request.urgency === 'medium' && styles.urgencyMedium,
                  request.urgency === 'low' && styles.urgencyLow
                ]}>
                  <Text style={styles.urgencyText}>{request.urgency}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{request.status}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{request.createdAt?.toDateString?.() || 'Unknown'}</Text>
              </View>
            </View>
          </View>

          {/* Photos */}
          {request.photos && request.photos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos ({request.photos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
                {request.photos.map((photo: string, index: number) => (
                  <ThumbnailImage
                    key={index}
                    uri={photo}
                    size={140}
                    onPress={() => {
                      setSelectedPhotoIndex(index);
                      setShowPhotoModal(true);
                    }}
                    style={styles.photoContainer}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Documents */}
          {request.documents && request.documents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents ({request.documents.length})</Text>
              <View style={styles.documentsGrid}>
                {request.documents.map((doc: string, index: number) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.documentCard}
                    onPress={() => {
                      if (typeof window !== 'undefined') {
                        window.open(doc, '_blank');
                      }
                    }}
                  >
                    <FileText size={20} color="#3b82f6" />
                    <Text style={styles.documentText}>Document {index + 1}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        </TouchableOpacity>
        
        <PhotoModal
          visible={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          photos={request.photos || []}
          initialIndex={selectedPhotoIndex}
        />
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  container: {
    width: '80%',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#1e40af',
  },
  photoContainer: {
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 140,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  voiceButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  voiceContainer: {
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  voiceControls: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  controlButton: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  carousel: {
    flexDirection: 'row',
  },

  documentText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
});