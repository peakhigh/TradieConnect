import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { Input } from './Input';
import { SimpleButton as Button } from './SimpleButton';
import { X, Calendar, Search } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import DateTimePicker from 'react-native-ui-datepicker';

type FilterStatus = 'all' | 'active' | 'completed' | 'cancelled';
type SortBy = 'date' | 'urgency' | 'tradeType';

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  filterStatus: FilterStatus;
  sortBy: SortBy;
  dateRange: { start?: Date; end?: Date };
  showDatePicker: boolean;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: FilterStatus) => void;
  onSortChange: (sort: SortBy) => void;
  onDateRangeChange: (range: { start?: Date; end?: Date }) => void;
  onToggleDatePicker: () => void;
  onClearDateRange: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  visible,
  onClose,
  searchQuery,
  filterStatus,
  sortBy,
  dateRange,
  showDatePicker,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onDateRangeChange,
  onToggleDatePicker,
  onClearDateRange,
  onSubmit,
  onCancel
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.drawer} 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Date Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={onToggleDatePicker}
              >
                <Calendar size={16} color={theme.colors.primary} />
                <Text style={styles.dateButtonText}>
                  {dateRange.start || dateRange.end 
                    ? `${dateRange.start?.toLocaleDateString() || 'Start'} - ${dateRange.end?.toLocaleDateString() || 'End'}`
                    : 'Select date range'
                  }
                </Text>
              </TouchableOpacity>
              {(dateRange.start || dateRange.end) && (
                <TouchableOpacity onPress={onClearDateRange} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear dates</Text>
                </TouchableOpacity>
              )}
              
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    mode="range"
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    onChange={(params) => onDateRangeChange({ start: params.startDate, end: params.endDate })}
                    selectedItemColor={theme.colors.primary}
                    selectedTextStyle={{ 
                      color: theme.colors.text.inverse,
                      fontWeight: 'bold'
                    }}
                    headerButtonColor={theme.colors.primary}
                    calendarTextStyle={{ 
                      color: theme.colors.text.primary,
                      fontSize: 16
                    }}
                    dayContainerStyle={{
                      backgroundColor: 'transparent',
                      borderRadius: 8,
                      minHeight: 36,
                      minWidth: 36,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    selectedRangeBackgroundColor={theme.colors.primary + '20'}
                    selectedRangeBorderColor={theme.colors.primary}
                    todayContainerStyle={{
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                      borderRadius: 8
                    }}
                  />
                  <View style={styles.datePickerActions}>
                    <Button
                      title="OK"
                      onPress={onToggleDatePicker}
                      style={styles.dateOkButton}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Status Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.filterButtons}>
                {(['all', 'active', 'completed', 'cancelled'] as FilterStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterButton, filterStatus === status && styles.selectedFilterButton]}
                    onPress={() => onStatusChange(status)}
                  >
                    <Text style={[styles.filterButtonText, filterStatus === status && styles.selectedFilterButtonText]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.filterButtons}>
                {(['date', 'urgency', 'tradeType'] as SortBy[]).map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    style={[styles.filterButton, sortBy === sort && styles.selectedFilterButton]}
                    onPress={() => onSortChange(sort)}
                  >
                    <Text style={[styles.filterButtonText, sortBy === sort && styles.selectedFilterButtonText]}>
                      {sort === 'date' ? 'Date' : sort === 'urgency' ? 'Urgency' : 'Trade Type'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="outline"
              style={styles.footerButton}
            />
            <Button
              title="Apply Filters"
              onPress={onSubmit}
              style={styles.footerButton}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  drawer: {
    backgroundColor: theme.colors.surface,
    width: Platform.OS === 'web' ? 400 : '85%',
    height: '100%',
    borderTopLeftRadius: Platform.OS === 'web' ? 0 : theme.borderRadius.xl,
    borderBottomLeftRadius: Platform.OS === 'web' ? 0 : theme.borderRadius.xl,
    ...theme.shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: theme.borderWidth.thin,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },

  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface,
  },
  dateButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  clearButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
  datePickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.light,
  },
  datePickerActions: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.md,
  },
  dateOkButton: {
    minWidth: 80,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.medium,
    backgroundColor: theme.colors.surface,
  },
  selectedFilterButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  selectedFilterButtonText: {
    color: theme.colors.text.inverse,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.border.light,
  },
  footerButton: {
    flex: 1,
  },
});