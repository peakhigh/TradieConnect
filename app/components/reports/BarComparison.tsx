import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarComparisonProps {
  data: BarDatum[];
  valuePrefix?: string;
  valueSuffix?: string;
  maxBars?: number;
}

/**
 * Horizontal bar comparison built with plain Views — works identically on
 * iOS, Android and Web (no SVG needed for bars, avoids platform quirks).
 */
export function BarComparison({ data, valuePrefix = '', valueSuffix = '', maxBars = 8 }: BarComparisonProps) {
  const rows = data.slice(0, maxBars);
  const max = Math.max(1, ...rows.map((r) => r.value));

  if (rows.length === 0) {
    return <Text style={styles.empty}>No data to compare yet.</Text>;
  }

  return (
    <View style={styles.container}>
      {rows.map((row, i) => {
        const pct = Math.max(2, Math.round((row.value / max) * 100));
        return (
          <View key={`${row.label}-${i}`} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>{row.label}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${pct}%`, backgroundColor: row.highlight ? theme.colors.success : theme.colors.primary },
                ]}
              />
            </View>
            <Text style={styles.value}>
              {valuePrefix}{formatNum(row.value)}{valueSuffix}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const formatNum = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 90, fontSize: 12, color: theme.colors.text.secondary },
  track: {
    flex: 1,
    height: 18,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 9,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 9 },
  value: { width: 56, fontSize: 12, fontWeight: '600', color: theme.colors.text.primary, textAlign: 'right' },
  empty: { fontSize: 13, color: theme.colors.text.tertiary, textAlign: 'center', paddingVertical: 16 },
});
