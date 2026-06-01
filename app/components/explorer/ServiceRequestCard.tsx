import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { EnrichedServiceRequest } from '../../types/explorer';
import { StatusBadge } from '../UI/StatusBadge';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Lock, 
  Unlock,
  Heart,
  BarChart3,
  HelpCircle,
  AlertTriangle
} from 'lucide-react-native';
import { functions, httpsCallable } from '../../services/firebase';

interface ServiceRequestCardProps {
  request: EnrichedServiceRequest;
  onUnlock: (requestId: string) => void;
  onSave: (requestId: string) => void;
  onHelp: (section: 'statuses' | 'intelligence' | 'unlock') => void;
  onSubmitQuote?: (request: EnrichedServiceRequest) => void;
  isSaved?: boolean;
  sequenceNumber?: number;
}

export default function ServiceRequestCard({ 
  request, 
  onUnlock, 
  onSave, 
  onHelp,
  onSubmitQuote,
  isSaved = false,
  sequenceNumber 
}: ServiceRequestCardProps) {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      default: return '#65a30d';
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return '#16a34a';
      case 'medium': return '#d97706';
      case 'high': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getOpportunityColor = (score: number) => {
    if (score >= 70) return '#16a34a';
    if (score >= 50) return '#d97706';
    return '#dc2626';
  };

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1h ago';
    return `${hours}h ago`;
  };

  const getTradeDisplay = () => {
    if (request.trades && request.trades.length > 0) {
      return request.trades.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
    }
    if ((request as any).tradeType && Array.isArray((request as any).tradeType)) {
      return (request as any).tradeType.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
    }
    if ((request as any).tradeType && typeof (request as any).tradeType === 'string') {
      return (request as any).tradeType.charAt(0).toUpperCase() + (request as any).tradeType.slice(1);
    }
    return 'General Service';
  };

  const handleUnlockPress = () => {
    setShowUnlockModal(true);
  };

  const handleUnlockConfirm = async () => {
    setUnlocking(true);
    try {
      const unlockFn = httpsCallable(functions, 'unlockServiceRequest');
      await unlockFn({ serviceRequestId: request.id });
      setShowUnlockModal(false);
      onUnlock(request.id);
    } catch (error: any) {
      setShowUnlockModal(false);
      const errorMessage = error?.message || 'Failed to unlock request';
      if (errorMessage.includes('Insufficient') || errorMessage.includes('wallet')) {
        Alert.alert('Insufficient Balance', 'Please recharge your wallet to unlock this request.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftInfo}>
            <Text style={styles.tradeType}>
              {sequenceNumber && `#${sequenceNumber}. `}
              {getTradeDisplay()}
            </Text>
          </View>
          <View style={styles.rightInfo}>
            <View style={styles.statusRow}>
              <StatusBadge status={request.status} userType="tradie" size="small" />
              <TouchableOpacity
                onPress={() => onHelp('statuses')}
                style={styles.helpIcon}
              >
                <HelpCircle size={12} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.location}>
              {request.postcode} • {request.distance?.toFixed(1) || '0.0'}km
            </Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => onSave(request.id)}
            >
              <Heart 
                size={16} 
                color={isSaved ? "#dc2626" : "#6b7280"}
                fill={isSaved ? "#dc2626" : "none"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description Preview */}
        <Text style={styles.description} numberOfLines={2}>
          {request.isUnlocked 
            ? request.description 
            : `${request.description?.substring(0, 50) || ''}...`
          }
        </Text>

        {/* Urgency & Time */}
        <View style={styles.metaRow}>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(request.urgency) }]}>
            <Clock size={10} color="#ffffff" />
            <Text style={styles.urgencyText}>
              {request.urgency?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.timeAgo}>
            Posted {formatTimeAgo(request.createdAt)}
          </Text>
        </View>

        {/* Market Intelligence - Always Visible */}
        <View style={styles.intelligenceSection}>
          <View style={styles.intelligenceHeader}>
            <BarChart3 size={14} color="#3b82f6" />
            <Text style={styles.intelligenceTitle}>Market Intelligence</Text>
            <TouchableOpacity
              onPress={() => onHelp('intelligence')}
              style={styles.helpIcon}
            >
              <HelpCircle size={12} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.intelligenceGrid}>
            <View style={styles.statItem}>
              <Users size={12} color="#6b7280" />
              <Text style={styles.statLabel}>{request.quotes?.totalQuotes || 0} quotes</Text>
            </View>
            
            <View style={styles.statItem}>
              <DollarSign size={12} color="#6b7280" />
              <Text style={styles.statLabel}>
                ${request.quotes?.priceRange?.min?.toFixed(2) || '0.00'} - ${request.quotes?.priceRange?.max?.toFixed(2) || '0.00'}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Clock size={12} color="#6b7280" />
              <Text style={styles.statLabel}>
                {request.quotes?.timelineRange?.minDays || 0}-{request.quotes?.timelineRange?.maxDays || 0} days
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={[
                styles.competitionDot, 
                { backgroundColor: getCompetitionColor(request.quotes?.competitionLevel || 'low') }
              ]} />
              <Text style={styles.statLabel}>
                {request.quotes?.competitionLevel || 'low'} competition
              </Text>
            </View>
          </View>

          {/* Opportunity Score */}
          <View style={styles.opportunityRow}>
            <TrendingUp size={12} color={getOpportunityColor(request.intelligence?.opportunityScore || 0)} />
            <Text style={[
              styles.opportunityText,
              { color: getOpportunityColor(request.intelligence?.opportunityScore || 0) }
            ]}>
              {(request.intelligence?.opportunityScore || 0).toFixed(1)}% Opportunity Score
            </Text>
            <Text style={styles.winRate}>
              • {((request.intelligence?.winProbability || 0) * 100).toFixed(1)}% win rate
            </Text>
          </View>
        </View>

        {/* Unlock Section */}
        {!request.isUnlocked ? (
          <View style={styles.unlockRow}>
            <Text style={styles.unlockNote}>Unlock full details and submit quote</Text>
            <View style={styles.unlockActions}>
              <TouchableOpacity
                onPress={() => onHelp('unlock')}
                style={styles.unlockHelpButton}
              >
                <HelpCircle size={12} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unlockButton}
                onPress={handleUnlockPress}
              >
                <Lock size={12} color="#3b82f6" />
                <Text style={styles.unlockText}>Unlock $0.50</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.unlockedSection}>
            <View style={styles.unlockedHeader}>
              <Unlock size={14} color="#16a34a" />
              <Text style={styles.unlockedTitle}>Full Details Unlocked</Text>
            </View>
            
            {/* Detailed Intelligence */}
            <View style={styles.detailedIntelligence}>
              <Text style={styles.recommendationTitle}>Winning Strategy:</Text>
              <Text style={styles.recommendationText}>
                • Quote around ${request.intelligence?.recommendedPriceRange?.optimal?.toFixed(2) || '0.00'} to be competitive
              </Text>
              <Text style={styles.recommendationText}>
                • Offer {request.quotes?.timelineRange?.averageDays?.toFixed(1) || '0'} day completion
              </Text>
              <Text style={styles.recommendationText}>
                • Market trend: {request.intelligence?.marketTrends?.priceDirection === 'up' ? '📈' : 
                  request.intelligence?.marketTrends?.priceDirection === 'down' ? '📉' : '➡️'} 
                {' '}Prices {request.intelligence?.marketTrends?.priceDirection || 'stable'}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.quoteButton}
              onPress={() => onSubmitQuote?.(request)}
            >
              <Text style={styles.quoteButtonText}>Submit Quote</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Unlock Confirmation Modal */}
      <Modal
        visible={showUnlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnlockModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !unlocking && setShowUnlockModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconCircle}>
                <AlertTriangle size={24} color="#d97706" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Unlock Request</Text>
            <Text style={styles.modalSubtitle}>
              This will deduct <Text style={styles.modalBold}>$0.50</Text> from your wallet to view full details of this{' '}
              <Text style={styles.modalBold}>{getTradeDisplay()}</Text> request in{' '}
              <Text style={styles.modalBold}>{request.postcode}</Text>. You can then submit a quote.
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalGoBackBtn}
                onPress={() => setShowUnlockModal(false)}
                activeOpacity={0.7}
                disabled={unlocking}
              >
                <Text style={styles.modalGoBackBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, unlocking && { opacity: 0.7 }]}
                onPress={handleUnlockConfirm}
                activeOpacity={0.7}
                disabled={unlocking}
              >
                {unlocking ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Unlock $0.50</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftInfo: {
    flex: 1,
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpIcon: {
    padding: 2,
  },
  tradeType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
  },
  saveButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#6b7280',
  },
  intelligenceSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  intelligenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flex: 1,
  },
  intelligenceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 4,
  },
  intelligenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  competitionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  opportunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opportunityText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  winRate: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  unlockNote: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  unlockActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unlockHelpButton: {
    padding: 4,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  unlockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 4,
  },
  unlockedSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  unlockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  unlockedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 4,
  },
  detailedIntelligence: {
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 10,
    color: '#166534',
    marginBottom: 2,
  },
  quoteButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  quoteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
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
  modalIconRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBold: {
    fontWeight: '700',
    color: '#1f2937',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalGoBackBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modalGoBackBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
  },
  modalConfirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
