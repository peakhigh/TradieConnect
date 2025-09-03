import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IntelligenceFilters as IntelligenceFiltersType } from '../../types/explorer';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react-native';

interface IntelligenceFiltersProps {
  filters: IntelligenceFiltersType;
  onFiltersChange: (filters: IntelligenceFiltersType) => void;
}

const COMPETITION_LEVELS = [
  { value: 'all', label: 'All Levels', color: '#6b7280' },
  { value: 'low', label: 'Low (<3 quotes)', color: '#16a34a' },
  { value: 'medium', label: 'Medium (3-7)', color: '#d97706' },
  { value: 'high', label: 'High (>7)', color: '#dc2626' },
];

const WIN_RATE_OPTIONS = [
  { value: 0, label: 'Any Win Rate' },
  { value: 50, label: '50%+ Win Rate' },
  { value: 70, label: '70%+ Win Rate' },
  { value: 85, label: '85%+ Win Rate' },
];

const PRICE_GAP_OPTIONS = [
  { value: 'all', label: 'Any Price Gap', description: 'All opportunities' },
  { value: 'large', label: 'Large Gap', description: '>$200 spread' },
  { value: 'medium', label: 'Medium Gap', description: '$100-200 spread' },
  { value: 'small', label: 'Small Gap', description: '<$100 spread' },
];

export default function IntelligenceFilters({ filters, onFiltersChange }: IntelligenceFiltersProps) {
  const updateCompetition = (level: string) => {
    onFiltersChange({ ...filters, competitionLevel: level as any });
  };

  const updateWinRate = (rate: number) => {
    onFiltersChange({ ...filters, winRateThreshold: rate });
  };

  const updatePriceGap = (gap: string) => {
    onFiltersChange({ ...filters, priceGap: gap as any });
  };

  const updateOpportunityScore = (min: number, max: number) => {
    onFiltersChange({ 
      ...filters, 
      opportunityScore: { min, max }
    });
  };

  return (
    <View style={styles.container}>
      {/* Competition Level */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Users size={16} color="#3b82f6" />
          <Text style={styles.sectionTitle}>Competition Level</Text>
        </View>
        <View style={styles.optionsContainer}>
          {COMPETITION_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.optionButton,
                filters.competitionLevel === level.value && styles.activeOption
              ]}
              onPress={() => updateCompetition(level.value)}
            >
              <View style={[styles.colorDot, { backgroundColor: level.color }]} />
              <Text style={[
                styles.optionText,
                filters.competitionLevel === level.value && styles.activeOptionText
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Win Rate Threshold */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={16} color="#16a34a" />
          <Text style={styles.sectionTitle}>Minimum Win Rate</Text>
        </View>
        <View style={styles.optionsContainer}>
          {WIN_RATE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                filters.winRateThreshold === option.value && styles.activeOption
              ]}
              onPress={() => updateWinRate(option.value)}
            >
              <Text style={[
                styles.optionText,
                filters.winRateThreshold === option.value && styles.activeOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Price Gap */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={16} color="#d97706" />
          <Text style={styles.sectionTitle}>Price Gap Opportunity</Text>
        </View>
        <View style={styles.optionsContainer}>
          {PRICE_GAP_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.gapOption,
                filters.priceGap === option.value && styles.activeGapOption
              ]}
              onPress={() => updatePriceGap(option.value)}
            >
              <Text style={[
                styles.gapTitle,
                filters.priceGap === option.value && styles.activeGapTitle
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.gapDescription,
                filters.priceGap === option.value && styles.activeGapDescription
              ]}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Opportunity Score Range */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={16} color="#7c3aed" />
          <Text style={styles.sectionTitle}>Opportunity Score</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {filters.opportunityScore.min}% - {filters.opportunityScore.max}%
          </Text>
          <Text style={styles.scoreNote}>
            Higher scores = better opportunities
          </Text>
          
          {/* Quick Score Presets */}
          <View style={styles.scorePresets}>
            <TouchableOpacity
              style={[
                styles.presetButton,
                filters.opportunityScore.min === 70 && styles.activePreset
              ]}
              onPress={() => updateOpportunityScore(70, 100)}
            >
              <Text style={[
                styles.presetText,
                filters.opportunityScore.min === 70 && styles.activePresetText
              ]}>
                High (70%+)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.presetButton,
                filters.opportunityScore.min === 50 && filters.opportunityScore.max === 100 && styles.activePreset
              ]}
              onPress={() => updateOpportunityScore(50, 100)}
            >
              <Text style={[
                styles.presetText,
                filters.opportunityScore.min === 50 && filters.opportunityScore.max === 100 && styles.activePresetText
              ]}>
                Medium (50%+)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.presetButton,
                filters.opportunityScore.min === 0 && styles.activePreset
              ]}
              onPress={() => updateOpportunityScore(0, 100)}
            >
              <Text style={[
                styles.presetText,
                filters.opportunityScore.min === 0 && styles.activePresetText
              ]}>
                All
              </Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginLeft: 6,
  },
  optionsContainer: {
    // Cross-platform compatible spacing
  },
  optionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  activeOption: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  optionText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  activeOptionText: {
    color: '#3b82f6',
    fontWeight: '600' as const,
  },
  gapOption: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  activeGapOption: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  gapTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 2,
  },
  activeGapTitle: {
    color: '#92400e',
  },
  gapDescription: {
    fontSize: 11,
    color: '#6b7280',
  },
  activeGapDescription: {
    color: '#92400e',
  },
  scoreContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#7c3aed',
    textAlign: 'center' as const,
  },
  scoreNote: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center' as const,
    marginTop: 4,
    marginBottom: 12,
  },
  scorePresets: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center' as const,
  },
  activePreset: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  activePresetText: {
    color: '#ffffff',
  },
});