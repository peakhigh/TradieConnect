/**
 * ReliabilityBadges — renders a tradie's earned trust badges.
 *
 * Presentational. Pass in badges derived via reliabilityService.deriveBadges().
 * Two layouts:
 *  - default: chips with icon + label (+ optional description line)
 *  - compact: small icon+label pills for dense contexts (e.g. quote cards)
 *
 * Cross-platform (iOS, Android, Web).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Award, Zap, TrendingUp, Briefcase, Sparkles } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { ReliabilityBadge, BadgeId } from '../../services/reliabilityService';

interface BadgeStyle {
  Icon: any;
  color: string;
  bg: string;
}

const BADGE_STYLES: Record<BadgeId, BadgeStyle> = {
  topRated: { Icon: Award, color: '#B45309', bg: '#FEF3C7' },
  fastResponder: { Icon: Zap, color: '#1D4ED8', bg: '#DBEAFE' },
  highWinRate: { Icon: TrendingUp, color: '#047857', bg: '#D1FAE5' },
  established: { Icon: Briefcase, color: '#6D28D9', bg: '#EDE9FE' },
  newcomer: { Icon: Sparkles, color: '#6B7280', bg: '#F3F4F6' },
};

interface ReliabilityBadgesProps {
  badges: ReliabilityBadge[];
  compact?: boolean;
}

export const ReliabilityBadges: React.FC<ReliabilityBadgesProps> = ({ badges, compact = false }) => {
  if (!badges || badges.length === 0) return null;

  if (compact) {
    return (
      <View style={styles.compactRow}>
        {badges.map((b) => {
          const s = BADGE_STYLES[b.id];
          const Icon = s.Icon;
          return (
            <View key={b.id} style={[styles.compactPill, { backgroundColor: s.bg }]}>
              <Icon size={11} color={s.color} />
              <Text style={[styles.compactText, { color: s.color }]}>{b.label}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {badges.map((b) => {
        const s = BADGE_STYLES[b.id];
        const Icon = s.Icon;
        return (
          <View key={b.id} style={[styles.card, { backgroundColor: s.bg }]}>
            <Icon size={18} color={s.color} />
            <View style={styles.cardText}>
              <Text style={[styles.label, { color: s.color }]}>{b.label}</Text>
              <Text style={styles.description}>{b.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 150,
    flexGrow: 1,
  },
  cardText: { flex: 1 },
  label: { fontSize: theme.fontSize.sm, fontWeight: '700' },
  description: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  compactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  compactText: { fontSize: 10, fontWeight: '700' },
});
