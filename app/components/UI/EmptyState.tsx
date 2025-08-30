import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  title?: string;
  message: string;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  style
}) => {
  return (
    <View style={[styles.emptyState, style]}>
      {title && (
        <Text style={styles.emptyStateTitle}>
          {title}
        </Text>
      )}
      <Text style={styles.emptyStateText}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#6b7280',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
});