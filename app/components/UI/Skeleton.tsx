import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../../theme/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function RequestCardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      {/* Header with trade type and status */}
      <View style={styles.cardHeader}>
        <Skeleton width="60%" height={18} />
        <View style={styles.headerRight}>
          <Skeleton width={70} height={20} borderRadius={10} />
          <Skeleton width={60} height={14} />
          <Skeleton width={16} height={16} borderRadius={8} />
        </View>
      </View>
      
      {/* Description */}
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="75%" height={16} style={{ marginBottom: 12 }} />
      
      {/* Urgency and time */}
      <View style={styles.metaRow}>
        <Skeleton width={60} height={18} borderRadius={9} />
        <Skeleton width={80} height={14} />
      </View>
      
      {/* Market Intelligence section */}
      <View style={styles.intelligenceSection}>
        <View style={styles.intelligenceHeader}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width={120} height={14} />
        </View>
        <View style={styles.intelligenceGrid}>
          <Skeleton width={80} height={12} />
          <Skeleton width={90} height={12} />
          <Skeleton width={70} height={12} />
          <Skeleton width={100} height={12} />
        </View>
        <View style={styles.opportunityRow}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width={150} height={12} />
        </View>
      </View>
      
      {/* Unlock button */}
      <Skeleton width="100%" height={40} borderRadius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.border.light,
  },
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
    gap: 4,
    marginBottom: 8,
  },
  intelligenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  opportunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});