import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, ChevronDown, X } from 'lucide-react-native';
import { theme } from '../../theme/theme';

export interface FilterTagsProps {
  dateRange: { start?: Date; end?: Date };
  filterStatus: string;
  sortBy: string;
  onDatePress: () => void;
  onStatusPress: () => void;
  onSortPress: () => void;
  onClearDate: () => void;
  onClearStatus: () => void;
  onClearSort: () => void;
  onClearAll?: () => void;
  statusOptions?: { value: string; label: string }[];
  sortOptions?: { value: string; label: string }[];
}

export const FilterTags: React.FC<FilterTagsProps> = ({
  dateRange,
  filterStatus,
  sortBy,
  onDatePress,
  onStatusPress,
  onSortPress,
  onClearDate,
  onClearStatus,
  onClearSort,
  onClearAll,
  statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ],
  sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'urgency', label: 'Urgency' },
    { value: 'tradeType', label: 'Trade Type' }
  ]
}) => {
  const getStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === filterStatus);
    return option ? option.label : filterStatus;
  };

  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : sortBy;
  };

  const hasActiveFilters = filterStatus !== 'all' || dateRange.start || dateRange.end || sortBy !== 'date';

  return (
    <View>
      {/* Clear All Button */}
      <View style={styles.clearAllContainer}>
        {hasActiveFilters && onClearAll ? (
          <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Clear all filters</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      
      <View style={styles.filterTagsRow}>
      {/* Date Filter Tag */}
      <TouchableOpacity style={[styles.filterTag, styles.dateFilterTag]} onPress={onDatePress}>
        <View style={styles.filterTagContent}>
          <View style={styles.filterTagHeader}>
            <Calendar size={16} color={theme.colors.primary} />
            <Text style={styles.filterTagTitle}>Dates</Text>
            {(dateRange.start || dateRange.end) ? (
              <TouchableOpacity onPress={onClearDate} style={styles.filterTagClose}>
                <X size={14} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : (
              <ChevronDown size={14} color={theme.colors.primary} />
            )}
          </View>
          <Text style={styles.filterTagValue}>
            {dateRange.start || dateRange.end 
              ? `${dateRange.start?.toLocaleDateString() || 'Start'} - ${dateRange.end?.toLocaleDateString() || 'End'}`
              : 'All'
            }
          </Text>
        </View>
      </TouchableOpacity>

      {/* Status Filter Tag */}
      <TouchableOpacity style={styles.filterTag} onPress={onStatusPress}>
        <View style={styles.filterTagContent}>
          <View style={styles.filterTagHeader}>
            <Text style={styles.filterTagTitle}>Status</Text>
            {filterStatus !== 'all' ? (
              <TouchableOpacity onPress={onClearStatus} style={styles.filterTagClose}>
                <X size={14} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : (
              <ChevronDown size={14} color={theme.colors.primary} />
            )}
          </View>
          <Text style={styles.filterTagValue}>{getStatusLabel()}</Text>
        </View>
      </TouchableOpacity>

      {/* Sort Filter Tag */}
      <TouchableOpacity style={styles.filterTag} onPress={onSortPress}>
        <View style={styles.filterTagContent}>
          <View style={styles.filterTagHeader}>
            <Text style={styles.filterTagTitle}>Sort</Text>
            {sortBy !== 'date' ? (
              <TouchableOpacity onPress={onClearSort} style={styles.filterTagClose}>
                <X size={14} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : (
              <ChevronDown size={14} color={theme.colors.primary} />
            )}
          </View>
          <Text style={styles.filterTagValue}>{getSortLabel()}</Text>
        </View>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  clearAllContainer: {
    alignItems: 'flex-end',
    minHeight: 24,
    marginBottom: theme.spacing.xs,
  },
  clearAllButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  clearAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  filterTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filterTag: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 48,
    minWidth: 100,
  },
  dateFilterTag: {
    flex: 1.5,
  },
  filterTagContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  filterTagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  filterTagTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  filterTagValue: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  filterTagClose: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});