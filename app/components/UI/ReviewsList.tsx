/**
 * ReviewsList — displays a tradie's reviews with a rating summary header.
 *
 * Cross-platform (iOS, Android, Web). Purely presentational: pass in the
 * reviews + summary fetched via reviewsService.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { formatTimeAgo } from '../../utils/helpers';
import { Review, ReviewSummary } from '../../services/reviewsService';

interface ReviewStarsProps {
  rating: number;
  size?: number;
}

/** Renders a 5-star row with the given rating filled. */
export const ReviewStars: React.FC<ReviewStarsProps> = ({ rating, size = 14 }) => (
  <View style={styles.starsRow} accessibilityLabel={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        color={theme.colors.warning}
        fill={n <= Math.round(rating) ? theme.colors.warning : 'none'}
      />
    ))}
  </View>
);

interface ReviewsListProps {
  reviews: Review[];
  summary: ReviewSummary;
  loading?: boolean;
  /** Headline average to show; falls back to summary.average */
  headlineAverage?: number;
  /** Headline total to show; falls back to summary.total */
  headlineTotal?: number;
  emptyMessage?: string;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  summary,
  loading = false,
  headlineAverage,
  headlineTotal,
  emptyMessage = 'No reviews yet. Reviews appear here after jobs are completed.',
}) => {
  const average = headlineAverage ?? summary.average;
  const total = headlineTotal ?? summary.total;
  const maxCount = Math.max(1, ...summary.distribution);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.mutedText}>Loading reviews…</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Summary header */}
      <View style={styles.summaryRow}>
        <View style={styles.averageBox}>
          <Text style={styles.averageNumber}>{average.toFixed(1)}</Text>
          <ReviewStars rating={average} size={16} />
          <Text style={styles.totalText}>
            {total} {total === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        {/* Distribution bars (5 star down to 1 star) */}
        <View style={styles.distribution}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution[star - 1];
            const widthPct = Math.round((count / maxCount) * 100);
            return (
              <View key={star} style={styles.distRow}>
                <Text style={styles.distStar}>{star}</Text>
                <Star size={11} color={theme.colors.warning} fill={theme.colors.warning} />
                <View style={styles.distTrack}>
                  <View style={[styles.distFill, { width: `${widthPct}%` }]} />
                </View>
                <Text style={styles.distCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Individual reviews */}
      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      ) : (
        <View style={styles.reviewsWrap}>
          {reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerAvatar}>
                  <Text style={styles.reviewerAvatarText}>
                    {(r.customerName || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName} numberOfLines={1}>
                    {r.customerName}
                  </Text>
                  <View style={styles.reviewMeta}>
                    <ReviewStars rating={r.rating} size={12} />
                    <Text style={styles.reviewTime}>{formatTimeAgo(r.createdAt)}</Text>
                  </View>
                </View>
              </View>
              {!!r.review && <Text style={styles.reviewText}>{r.review}</Text>}
              {r.trades.length > 0 && (
                <Text style={styles.reviewTrades}>{r.trades.join(', ')}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centerBox: { paddingVertical: 24, alignItems: 'center' },
  mutedText: { fontSize: theme.fontSize.sm, color: theme.colors.text.tertiary },
  starsRow: { flexDirection: 'row', gap: 1 },
  summaryRow: {
    flexDirection: 'row',
    gap: 20,
    padding: 16,
    backgroundColor: theme.colors.surfaceTertiary,
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
    alignItems: 'center',
  },
  averageBox: { alignItems: 'center', gap: 4, minWidth: 80 },
  averageNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  totalText: { fontSize: theme.fontSize.xs, color: theme.colors.text.secondary },
  distribution: { flex: 1, gap: 4 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distStar: { fontSize: theme.fontSize.xs, color: theme.colors.text.secondary, width: 10, textAlign: 'right' },
  distTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  distFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.warning },
  distCount: { fontSize: theme.fontSize.xs, color: theme.colors.text.tertiary, width: 20 },
  reviewsWrap: { gap: 12 },
  reviewCard: {
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface,
  },
  reviewHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  reviewerInfo: { flex: 1 },
  reviewerName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  reviewTime: { fontSize: theme.fontSize.xs, color: theme.colors.text.tertiary },
  reviewText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  reviewTrades: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
