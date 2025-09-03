import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EnrichedServiceRequest } from '../../types/explorer';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Lock, 
  Unlock,
  Heart,
  BarChart3
} from 'lucide-react-native';

interface ServiceRequestCardProps {
  request: EnrichedServiceRequest;
  onUnlock: (requestId: string) => void;
  onSave: (requestId: string) => void;
  isSaved?: boolean;
  sequenceNumber?: number;
}

export default function ServiceRequestCard({ 
  request, 
  onUnlock, 
  onSave, 
  isSaved = false,
  sequenceNumber 
}: ServiceRequestCardProps) {
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

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.tradeInfo}>
          <View style={styles.tradeTypeRow}>
            <Text style={styles.tradeType}>
              {(request.trades || []).map(t => t.toUpperCase()).join(' • ')}
            </Text>
          </View>
          <View style={styles.locationRow}>
            {sequenceNumber && (
              <View style={styles.sequenceNumber}>
                <Text style={styles.sequenceText}>#{sequenceNumber}</Text>
              </View>
            )}
            <MapPin size={12} color="#6b7280" />
            <Text style={styles.location}>
              {request.suburb} ({request.postcode})
            </Text>
            {request.distance && (
              <Text style={styles.distance}>• {request.distance}km</Text>
            )}
          </View>
        </View>
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

      {/* Description Preview */}
      <Text style={styles.description} numberOfLines={2}>
        {request.isUnlocked 
          ? request.description 
          : `${request.description.substring(0, 50)}...`
        }
      </Text>

      {/* Urgency & Time */}
      <View style={styles.metaRow}>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(request.urgency) }]}>
          <Clock size={10} color="#ffffff" />
          <Text style={styles.urgencyText}>
            {request.urgency.toUpperCase()}
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
        </View>
        
        <View style={styles.intelligenceGrid}>
          {/* Quote Stats */}
          <View style={styles.statItem}>
            <Users size={12} color="#6b7280" />
            <Text style={styles.statLabel}>{request.quotes.totalQuotes} quotes</Text>
          </View>
          
          {/* Price Range */}
          <View style={styles.statItem}>
            <DollarSign size={12} color="#6b7280" />
            <Text style={styles.statLabel}>
              ${request.quotes.priceRange.min.toFixed(2)} - ${request.quotes.priceRange.max.toFixed(2)}
            </Text>
          </View>
          
          {/* Timeline */}
          <View style={styles.statItem}>
            <Clock size={12} color="#6b7280" />
            <Text style={styles.statLabel}>
              {request.quotes.timelineRange.minDays}-{request.quotes.timelineRange.maxDays} days
            </Text>
          </View>
          
          {/* Competition Level */}
          <View style={styles.statItem}>
            <View style={[
              styles.competitionDot, 
              { backgroundColor: getCompetitionColor(request.quotes.competitionLevel) }
            ]} />
            <Text style={styles.statLabel}>
              {request.quotes.competitionLevel} competition
            </Text>
          </View>
        </View>

        {/* Opportunity Score */}
        <View style={styles.opportunityRow}>
          <TrendingUp size={12} color={getOpportunityColor(request.intelligence.opportunityScore)} />
          <Text style={[
            styles.opportunityText,
            { color: getOpportunityColor(request.intelligence.opportunityScore) }
          ]}>
            {request.intelligence.opportunityScore.toFixed(1)}% Opportunity Score
          </Text>
          <Text style={styles.winRate}>
            • {(request.intelligence.winProbability * 100).toFixed(1)}% win rate
          </Text>
        </View>
      </View>

      {/* Unlock Section */}
      {!request.isUnlocked ? (
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={() => onUnlock(request.id)}
        >
          <Lock size={16} color="#3b82f6" />
          <Text style={styles.unlockText}>Unlock for $0.50</Text>
        </TouchableOpacity>
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
              • Quote around ${request.intelligence.recommendedPriceRange.optimal.toFixed(2)} to be competitive
            </Text>
            <Text style={styles.recommendationText}>
              • Offer {request.quotes.timelineRange.averageDays.toFixed(1)} day completion
            </Text>
            <Text style={styles.recommendationText}>
              • Market trend: {request.intelligence.marketTrends.priceDirection === 'up' ? '📈' : 
                request.intelligence.marketTrends.priceDirection === 'down' ? '📉' : '➡️'} 
              {' '}Prices {request.intelligence.marketTrends.priceDirection}
            </Text>
          </View>

          <TouchableOpacity style={styles.quoteButton}>
            <Text style={styles.quoteButtonText}>Submit Quote</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  tradeInfo: {
    flex: 1,
  },
  tradeTypeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  sequenceNumber: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  sequenceText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  tradeType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3b82f6',
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  distance: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  urgencyBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  intelligenceTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3b82f6',
    marginLeft: 4,
  },
  intelligenceGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  opportunityText: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  winRate: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  unlockButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  unlockText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#3b82f6',
    marginLeft: 6,
  },
  unlockedSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  unlockedHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  unlockedTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
    alignItems: 'center' as const,
  },
  quoteButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
});