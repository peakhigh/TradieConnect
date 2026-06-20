import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../../theme/theme';

export interface DonutSlice {
  label: string;
  value: number;
}

interface DonutShareProps {
  data: DonutSlice[];
  size?: number;
  centerLabel?: string;
}

const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#65A30D'];

/**
 * Donut chart using react-native-svg (works on iOS, Android, Web).
 * Renders slices as stroked circle arcs via strokeDasharray offsets.
 */
export function DonutShare({ data, size = 160, centerLabel }: DonutShareProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const stroke = size * 0.16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  if (total <= 0) {
    return <Text style={styles.empty}>No value data yet.</Text>;
  }

  let offset = 0;

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {data.map((slice, i) => {
            const frac = slice.value / total;
            const dash = frac * circumference;
            const circle = (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                rotation={-90}
                origin={`${cx}, ${cy}`}
              />
            );
            offset += dash;
            return circle;
          })}
        </Svg>
        {centerLabel ? (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Text style={styles.centerLabel}>{centerLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.legend}>
        {data.map((slice, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: COLORS[i % COLORS.length] }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{slice.label}</Text>
            <Text style={styles.legendPct}>{Math.round((slice.value / total) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  centerLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 12, color: theme.colors.text.secondary },
  legendPct: { fontSize: 12, fontWeight: '600', color: theme.colors.text.primary },
  empty: { fontSize: 13, color: theme.colors.text.tertiary, textAlign: 'center', paddingVertical: 16 },
});
