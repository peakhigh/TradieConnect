import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  message: string;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  style
}) => {
  return (
    <View style={[styles.emptyState, style]}>
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
  emptyStateText: {
    color: '#6b7280',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
});