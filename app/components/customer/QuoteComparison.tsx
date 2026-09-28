/**
 * QuoteComparison — side-by-side comparison of quotes for a service request.
 *
 * Renders each quote as a column in a horizontally scrollable table so the
 * customer can compare price, timeline, materials/labour split, and rating at
 * a glance. Best value in each row is highlighted. Accept/Decline actions are
 * surfaced per column when the request is still open.
 *
 * Cross-platform (iOS, Android, Web). Presentational — parent owns the data
 * and the accept/decline handlers.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, CheckCircle2, XCircle, TrendingDown, Zap } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { formatCurrency } from '../../utils/helpers';
import { Quote } from '../../types';

interface QuoteComparisonProps {
  quotes: Quote[];
  /** Whether the request is still open for accept/decline actions. */
  canAct: boolean;
  isActionable: (status: Quote['status']) => boolean;
  onAccept: (quote: Quote) => void;
  onDecline: (quote: Quote) => void;
}

const COLUMN_WIDTH = 180;

export const QuoteComparison: React.FC<QuoteComparisonProps> = ({
  quotes,
  canAct,
  isActionable,
  onAccept,
  onDecline,
}) => {
  if (quotes.length === 0) return null;

  // Compute "best" values across quotes for highlighting.
  const prices = quotes.map((q) => q.totalPrice || 0).filter((n) => n > 0);
  const timelines = quotes.map((q) => q.timelineDays || 0).filter((n) => n > 0);
  const ratings = quotes.map((q) => q.tradieRating || 0);

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const minTimeline = timelines.length ? Math.min(...timelines) : 0;
  const maxRating = ratings.length ? Math.max(...ratings) : 0;

  const rowLabelColumn = (
    <View style={styles.labelColumn}>
      <View style={[styles.cell, styles.headerCell, styles.labelHeaderCell]}>
        <Text style={styles.labelHeaderText}>Compare</Text>
      </View>
      <View style={styles.cell}><Text style={styles.rowLabel}>Total price</Text></View>
      <View style={styles.cell}><Text style={styles.rowLabel}>Timeline</Text></View>
      <View style={styles.cell}><Text style={styles.rowLabel}>Materials</Text></View>
      <View style={styles.cell}><Text style={styles.rowLabel}>Labour</Text></View>
      <View style={styles.cell}><Text style={styles.rowLabel}>Rating</Text></View>
      <View style={[styles.cell, styles.notesCell]}><Text style={styles.rowLabel}>Notes</Text></View>
      {canAct && <View style={[styles.cell, styles.actionCell]} />}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {/* Fixed label column */}
      {rowLabelColumn}

      {/* Scrollable quote columns */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {quotes.map((quote) => {
          const accepted = quote.status === 'accepted';
          const rejected = quote.status === 'rejected';
          const isBestPrice = (quote.totalPrice || 0) > 0 && quote.totalPrice === minPrice;
          const isFastest = (quote.timelineDays || 0) > 0 && quote.timelineDays === minTimeline;
          const isTopRated = maxRating > 0 && (quote.tradieRating || 0) === maxRating;
          const showAct = canAct && isActionable(quote.status);

          return (
            <View
              key={quote.id}
              style={[styles.quoteColumn, accepted && styles.quoteColumnAccepted]}
            >
              {/* Header: tradie name */}
              <View style={[styles.cell, styles.headerCell]}>
                <Text style={styles.tradieName} numberOfLines={1}>
                  {quote.tradieName}
                </Text>
                {accepted && (
                  <View style={styles.statusPill}>
                    <CheckCircle2 size={11} color="#059669" />
                    <Text style={[styles.statusPillText, { color: '#059669' }]}>Accepted</Text>
                  </View>
                )}
                {rejected && (
                  <View style={styles.statusPill}>
                    <XCircle size={11} color="#DC2626" />
                    <Text style={[styles.statusPillText, { color: '#DC2626' }]}>Declined</Text>
                  </View>
                )}
              </View>

              {/* Total price */}
              <View style={[styles.cell, isBestPrice && styles.bestCell]}>
                <Text style={[styles.priceValue, isBestPrice && styles.bestValue]}>
                  {formatCurrency(quote.totalPrice || 0)}
                </Text>
                {isBestPrice && (
                  <View style={styles.bestTag}>
                    <TrendingDown size={10} color="#059669" />
                    <Text style={styles.bestTagText}>Lowest</Text>
                  </View>
                )}
              </View>

              {/* Timeline */}
              <View style={[styles.cell, isFastest && styles.bestCell]}>
                <Text style={[styles.cellValue, isFastest && styles.bestValue]}>
                  {(quote.timelineDays || 0) > 0
                    ? `${quote.timelineDays} day${quote.timelineDays! > 1 ? 's' : ''}`
                    : '—'}
                </Text>
                {isFastest && (
                  <View style={styles.bestTag}>
                    <Zap size={10} color="#059669" />
                    <Text style={styles.bestTagText}>Fastest</Text>
                  </View>
                )}
              </View>

              {/* Materials */}
              <View style={styles.cell}>
                <Text style={styles.cellValue}>{formatCurrency(quote.materialsCost || 0)}</Text>
              </View>

              {/* Labour */}
              <View style={styles.cell}>
                <Text style={styles.cellValue}>{formatCurrency(quote.laborCost || 0)}</Text>
              </View>

              {/* Rating */}
              <View style={[styles.cell, isTopRated && styles.bestCell]}>
                <View style={styles.ratingRow}>
                  <Star size={13} color="#fbbf24" fill={(quote.tradieRating || 0) > 0 ? '#fbbf24' : 'none'} />
                  <Text style={[styles.cellValue, isTopRated && styles.bestValue]}>
                    {(quote.tradieRating || 0) > 0 ? quote.tradieRating!.toFixed(1) : '—'}
                  </Text>
                </View>
              </View>

              {/* Notes */}
              <View style={[styles.cell, styles.notesCell]}>
                <Text style={styles.notesText} numberOfLines={4}>
                  {quote.notes || '—'}
                </Text>
              </View>

              {/* Actions */}
              {canAct && (
                <View style={[styles.cell, styles.actionCell]}>
                  {showAct ? (
                    <>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(quote)}>
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.declineBtn} onPress={() => onDecline(quote)}>
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.noActionText}>—</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const CELL_HEIGHT = 48;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  labelColumn: {
    width: 90,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    backgroundColor: theme.colors.surfaceTertiary,
  },
  quoteColumn: {
    width: COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
  },
  quoteColumnAccepted: {
    backgroundColor: '#F0FDF4',
  },
  cell: {
    minHeight: CELL_HEIGHT,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerCell: {
    minHeight: 56,
    backgroundColor: theme.colors.surfaceTertiary,
    justifyContent: 'center',
  },
  labelHeaderCell: {
    backgroundColor: theme.colors.surfaceTertiary,
  },
  labelHeaderText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  rowLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  notesCell: { minHeight: 84 },
  actionCell: { minHeight: 84, gap: 6, borderBottomWidth: 0 },
  tradieName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  statusPillText: { fontSize: 10, fontWeight: '600' },
  cellValue: { fontSize: theme.fontSize.sm, color: theme.colors.text.primary },
  priceValue: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.primary },
  bestCell: { backgroundColor: '#ECFDF5' },
  bestValue: { color: '#059669' },
  bestTag: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  bestTagText: { fontSize: 9, fontWeight: '700', color: '#059669' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notesText: { fontSize: theme.fontSize.xs, color: theme.colors.text.secondary, lineHeight: 16 },
  acceptBtn: {
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#059669',
  },
  acceptBtnText: { fontSize: theme.fontSize.xs, fontWeight: '700', color: '#FFF' },
  declineBtn: {
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  declineBtnText: { fontSize: theme.fontSize.xs, fontWeight: '600', color: '#6B7280' },
  noActionText: { fontSize: theme.fontSize.sm, color: theme.colors.text.tertiary, textAlign: 'center' },
});
