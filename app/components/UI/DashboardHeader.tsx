import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { theme } from '../../theme/theme';

interface DashboardHeaderProps {
  userName?: string;
  title?: string;
  subtitle?: string;
  showSparkles?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  title,
  subtitle,
  showSparkles = true
}) => {
  const displayTitle = title || `Welcome back, ${userName}!`;
  
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {showSparkles && <Sparkles size={24} color={theme.colors.primary} />} {displayTitle}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.xxl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  title: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.xxl : theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.md : theme.fontSize.sm,
    color: theme.colors.text.secondary,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
});