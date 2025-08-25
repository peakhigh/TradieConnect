import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions, Animated } from 'react-native';
import { X, FileText } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { VoicePlayer } from './VoicePlayer';

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
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
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

          {/* Images Carousel */}
          {request.photos && request.photos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos ({request.photos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
                {request.photos.map((photo: string, index: number) => (
                  <Image key={index} source={{ uri: photo }} style={styles.carouselImage} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Documents */}
          {request.documents && request.documents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents ({request.documents.length})</Text>
              {request.documents.map((doc: string, index: number) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.documentLink}
                  onPress={() => {
                    if (typeof window !== 'undefined') {
                      window.open(doc, '_blank');
                    }
                  }}
                >
                  <FileText size={16} color="#3b82f6" />
                  <Text style={styles.documentText}>Document {index + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Other Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request Details</Text>
            <Text style={styles.detail}>Postcode: {request.postcode}</Text>
            <Text style={styles.detail}>Urgency: {request.urgency}</Text>
            <Text style={styles.detail}>Status: {request.status}</Text>
            <Text style={styles.detail}>Created: {request.createdAt?.toDateString?.() || 'Unknown'}</Text>
          </View>
        </ScrollView>
        </Animated.View>
      </View>
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
    color: '#6b7280',
    lineHeight: 20,
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
  carouselImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  documentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  documentText: {
    fontSize: 14,
    color: '#3b82f6',
  },
  detail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
});