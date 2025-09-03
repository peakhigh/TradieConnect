import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { DataFilters as DataFiltersType } from '../../types/explorer';

interface DataFiltersProps {
  filters: DataFiltersType;
  onFiltersChange: (filters: DataFiltersType) => void;
}

const TRADE_TYPES = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Tiling', 'Roofing'];
const URGENCY_LEVELS = [
  { value: 'urgent', label: 'Urgent', color: '#dc2626' },
  { value: 'high', label: 'High', color: '#ea580c' },
  { value: 'medium', label: 'Medium', color: '#d97706' },
  { value: 'low', label: 'Low', color: '#65a30d' },
];

export default function DataFilters({ filters, onFiltersChange }: DataFiltersProps) {
  const toggleTrade = (trade: string) => {
    const newTrades = filters.trades.includes(trade)
      ? filters.trades.filter(t => t !== trade)
      : [...filters.trades, trade];
    
    onFiltersChange({ ...filters, trades: newTrades });
  };

  const toggleUrgency = (urgency: 'low' | 'medium' | 'high' | 'urgent') => {
    const newUrgency = filters.urgency.includes(urgency)
      ? filters.urgency.filter(u => u !== urgency)
      : [...filters.urgency, urgency];
    
    onFiltersChange({ ...filters, urgency: newUrgency });
  };

  return (
    <View style={styles.container}>
      {/* Trade Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trade Types</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainer}>
            {TRADE_TYPES.map((trade) => (
              <TouchableOpacity
                key={trade}
                style={[
                  styles.chip,
                  filters.trades.includes(trade.toLowerCase()) && styles.activeChip
                ]}
                onPress={() => toggleTrade(trade.toLowerCase())}
              >
                <Text style={[
                  styles.chipText,
                  filters.trades.includes(trade.toLowerCase()) && styles.activeChipText
                ]}>
                  {trade}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Urgency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Urgency Level</Text>
        <View style={styles.urgencyContainer}>
          {URGENCY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.urgencyChip,
                filters.urgency.includes(level.value as any) && { 
                  backgroundColor: level.color,
                  borderColor: level.color 
                }
              ]}
              onPress={() => toggleUrgency(level.value as any)}
            >
              <Text style={[
                styles.urgencyText,
                filters.urgency.includes(level.value as any) && styles.activeUrgencyText
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budget Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Range</Text>
        <View style={styles.budgetContainer}>
          <Text style={styles.budgetText}>
            ${filters.budget.min} - ${filters.budget.max}
          </Text>
          <Text style={styles.budgetNote}>
            Drag sliders to adjust (coming soon)
          </Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>
            {filters.location.postcode || 'All areas'} • {filters.location.radius}km radius
          </Text>
          <Text style={styles.locationNote}>
            Tap to set location (coming soon)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row' as const,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeChip: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  activeChipText: {
    color: '#ffffff',
  },
  urgencyContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  urgencyChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  activeUrgencyText: {
    color: '#ffffff',
  },
  budgetContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  budgetText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151',
  },
  budgetNote: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  locationContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151',
  },
  locationNote: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
});