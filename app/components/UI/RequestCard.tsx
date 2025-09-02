import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { Edit3, Lock, Image as ImageIcon, FileText, Users, MessageCircle, X } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { createTextDecoration, createCursorStyle } from '../../theme/crossPlatform';
import { isWebDesktop } from '../../utils/platform';
import { AudioPlayer } from './AudioPlayer';
import { ThumbnailImage } from './ThumbnailImage';

interface RequestCardProps {
  request: any;
  onEdit?: (requestId: string) => void;
  onViewDetails?: (request: any) => void;
  onViewInterests?: (requestId: string) => void;
  onViewMessages?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  onPhotoPress?: (photoIndex: number, request: any) => void;
  showEditButton?: boolean;
  showButtons?: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onEdit,
  onViewDetails,
  onViewInterests,
  onViewMessages,
  onCancel,
  onPhotoPress,
  showEditButton = true,
  showButtons = true
}) => {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const handleIconPress = (type: string) => {
    setSelectedIcon(selectedIcon === type ? null : type);
  };

  return (
    <View style={styles.requestCard}>
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => onViewDetails?.(request)} style={styles.titleContainer}>
          <View style={styles.titleWithIcon}>
            <Text style={[styles.requestTitle, styles.tradeLink]}>
              {request.tradeType}
            </Text>
            {showEditButton && (
              request.status === 'active' ? (
                <TouchableOpacity 
                  style={styles.editIcon}
                  onPress={() => onEdit?.(request.id)}
                >
                  <Edit3 size={16} color="#6b7280" />
                </TouchableOpacity>
              ) : (
                <View style={styles.lockIcon}>
                  <Lock size={16} color="#9ca3af" />
                </View>
              )
            )}
          </View>
        </TouchableOpacity>
        
        <View style={styles.titleTags}>
          <View style={[styles.urgencyTag, 
            request.urgency === 'high' && styles.urgencyHigh,
            request.urgency === 'medium' && styles.urgencyMedium,
            request.urgency === 'low' && styles.urgencyLow
          ]}>
            <Text style={styles.urgencyText}>{request.urgency}</Text>
          </View>
          
          <View style={styles.statusTag}>
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>
      </View>
      
      <View>
        {request.description && (
          <Text style={styles.requestDescription} numberOfLines={1}>
            {request.description}
          </Text>
        )}
        {request.voiceMessage && (
          <AudioPlayer audioUrl={request.voiceMessage} compact={true} />
        )}
      </View>
      
      <Text style={styles.postcodeText}>Postcode: {request.postcode}</Text>
      
      {showButtons && (
      <View style={styles.allIcons}>
        <TouchableOpacity 
          style={[styles.iconButton, selectedIcon === 'photos' && styles.selectedIcon]}
          onPress={() => handleIconPress('photos')}
        >
          <View style={styles.iconTop}>
            <Text style={styles.iconCount}>{request.photos ? request.photos.length.toString() : '0'}</Text>
            <ImageIcon size={22} color="#3b82f6" />
          </View>
          <Text style={styles.iconLabel}>Photos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconButton, selectedIcon === 'documents' && styles.selectedIcon]}
          onPress={() => handleIconPress('documents')}
        >
          <View style={styles.iconTop}>
            <Text style={styles.iconCount}>{request.documents ? request.documents.length.toString() : '0'}</Text>
            <FileText size={22} color="#3b82f6" />
          </View>
          <Text style={styles.iconLabel}>Files</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => onViewInterests?.(request.id)}
          style={styles.iconButton}
        >
          <View style={styles.iconTop}>
            <Text style={styles.iconCount}>{'0'}</Text>
            <Users size={22} color="#3b82f6" />
          </View>
          <Text style={styles.iconLabel}>Interests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => onViewMessages?.(request.id)}
          style={styles.iconButton}
        >
          <View style={styles.iconTop}>
            <Text style={styles.iconCount}>{'0'}</Text>
            <MessageCircle size={22} color="#3b82f6" />
          </View>
          <Text style={styles.iconLabel}>Messages</Text>
        </TouchableOpacity>
        
        {request.status === 'active' && onCancel && (
          <TouchableOpacity 
            onPress={() => onCancel(request.id)}
            style={styles.iconButton}
          >
            <View style={styles.iconTop}>
              <X size={22} color="#dc2626" />
            </View>
            <Text style={[styles.iconLabel, styles.cancelLabel]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      )}
      
      {selectedIcon === 'photos' && request.photos && request.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
          {request.photos.map((photo: string, index: number) => (
            <ThumbnailImage
              key={index}
              uri={photo}
              size={isWebDesktop ? 70 : 40}
              onPress={() => onPhotoPress?.(index, request)}
              style={styles.thumbnailSpacing}
            />
          ))}
        </ScrollView>
      )}
      
      {selectedIcon === 'documents' && request.documents && request.documents.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.documentsRow}>
          {request.documents.map((doc: string, index: number) => (
            <TouchableOpacity 
              key={index}
              style={styles.documentItem}
              onPress={() => {
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.open(doc, '_blank');
                } else {
                  // For mobile, you could use Linking.openURL(doc) or a document viewer
                  console.log('Open document:', doc);
                }
              }}
            >
              <FileText size={isWebDesktop ? 28 : 16} color="#3b82f6" />
              <Text style={styles.documentName} numberOfLines={1}>
                Doc {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.padding.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.light,
    marginBottom: theme.margin.md,
    ...theme.shadows.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.margin.sm,
  },
  titleContainer: {
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap.lg,
  },
  editIcon: {
    padding: theme.padding.xs,
    ...createCursorStyle('pointer'),
  },
  lockIcon: {
    padding: theme.padding.xs,
    opacity: theme.opacity.disabled,
  },
  requestTitle: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.lg : theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  tradeLink: {
    color: theme.colors.primary,
    ...createTextDecoration('underline'),
    ...createCursorStyle('pointer'),
  },
  titleTags: {
    flexDirection: 'row',
    gap: theme.gap.md,
    alignItems: 'center',
  },
  urgencyTag: {
    paddingHorizontal: theme.padding.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
  },
  urgencyHigh: theme.colors.urgency.high,
  urgencyMedium: theme.colors.urgency.medium,
  urgencyLow: theme.colors.urgency.low,
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#374151',
  },
  statusTag: {
    paddingHorizontal: theme.padding.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.notification.info,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.notification.infoBorder,
  },
  statusText: {
    fontSize: theme.fontSize.xxs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'capitalize',
    color: theme.colors.notification.infoText,
  },
  requestDescription: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.margin.sm,
    flexWrap: 'wrap',
    lineHeight: Platform.OS === 'web' ? 24 : 20,
  },
  postcodeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.margin.md,
  },
  allIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.margin.sm,
  },
  iconButton: {
    alignItems: 'center',
    paddingVertical: theme.padding.sm,
    paddingHorizontal: theme.padding.md,
    backgroundColor: theme.colors.surfaceTertiary,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    marginHorizontal: 2,
    ...createCursorStyle('pointer'),
  },
  selectedIcon: {
    backgroundColor: theme.colors.notification.info,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.primary,
  },
  iconTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap.xs,
  },
  iconCount: {
    fontSize: isWebDesktop ? theme.fontSize.xl : theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  iconLabel: {
    fontSize: isWebDesktop ? theme.fontSize.xl : theme.fontSize.xxs,
    color: theme.colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  cancelLabel: {
    color: theme.colors.error,
  },
  thumbnailRow: {
    marginTop: theme.margin.md,
    marginBottom: theme.margin.sm,
  },
  thumbnailSpacing: {
    marginRight: theme.margin.md,
  },
  documentsRow: {
    marginTop: theme.margin.md,
    marginBottom: theme.margin.sm,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap.xs,
    paddingVertical: theme.padding.xs,
    paddingHorizontal: theme.padding.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xs,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.light,
    marginRight: theme.margin.md,
    ...createCursorStyle('pointer'),
  },
  documentName: {
    fontSize: isWebDesktop ? theme.fontSize.md : theme.fontSize.xxs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});