import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, DollarSign, FileText, TrendingUp } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { CompetitionLevel } from '../../types/reporting';

interface SuburbStatRowProps {
  rank?: number;
  suburb: string;
  postcode?: string;
  trade?: string;
  requestCount: number;
  acceptedValue: number;
  totalQuotedValue?: number;
  competitionLevel?: CompetitionLevel;
  distanceKm?: number;
  onPress?: () => void;
}

const compColor = (level?: CompetitionLevel) => {
  switch (level) {
    case 'low': return '#16a34a';
    case 'medium': return '#d97706';
    case 'high': return '#dc2626';
    default: return theme.colors.text.tertiary;
  }
};

const money = (n: number) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
};

export function SuburbStatRow(props: SuburbStatRowProps) {
  const {
    rank, suburb, postcode, trade, requestCount, acceptedValue,
    totalQuotedValue, competitionLevel, distanceKm, onPress,
  } = props;

  const Wrapper: any = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        {typeof rank === 'number' && <Text style={styles.rank}>#{rank}</Text>}
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <MapPin size={13} color={theme.colors.primary} />
            <Text style={styles.suburb} numberOfLines={1}>
              {suburb}{postcode ? ` ${postcode}` : ''}
            </Text>
          </View>
          {(trade || typeof distanceKm === 'number') && (
            <Text style={styles.sub} numberOfLines={1}>
              {trade || ''}{trade && typeof distanceKm === 'number' ? ' • ' : ''}
              {typeof distanceKm === 'number' ? `${distanceKm.toFixed(1)}km away` : ''}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <DollarSign size={12} color="#16a34a" />
          <Text style={[styles.metricValue, { color: '#16a34a' }]}>{money(acceptedValue || totalQuotedValue || 0)}</Text>
        </View>
        <View style={styles.metric}>
          <FileText size={12} color={theme.colors.text.secondary} />
          <Text style={styles.metricValue}>{requestCount}</Text>
        </View>
        {competitionLevel && (
          <View style={styles.metric}>
            <View style={[styles.dot, { backgroundColor: compColor(competitionLevel) }]} />
            <Text style={[styles.metricValue, { color: compColor(competitionLevel) }]}>{competitionLevel}</Text>
          </View>
        )}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  rank: { fontSize: 13, fontWeight: '700', color: theme.colors.text.tertiary, width: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suburb: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, flex: 1 },
  sub: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 2 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metricValue: { fontSize: 12, fontWeight: '600', color: theme.colors.text.primary },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
