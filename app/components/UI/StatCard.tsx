import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface StatCardProps {
  number: string | number;
  label: string;
  color?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  number,
  label,
  color = '#4f46e5',
  onPress
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent style={styles.statCard} onPress={onPress}>
      <Text style={[styles.statNumber, { color }]}>
        {number.toString()}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});