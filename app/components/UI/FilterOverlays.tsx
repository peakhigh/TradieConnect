import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SimpleButton as Button } from './SimpleButton';
import { SimpleDatePicker } from './SimpleDatePicker';
import { theme } from '../../theme/theme';

export interface FilterOverlaysProps {
  // Date Picker
  showDatePicker: boolean;
  tempDateRange: { start?: Date; end?: Date };
  onDateRangeChange: (start?: Date, end?: Date) => void;
  onDatePickerClose: () => void;
  onDatePickerCancel: () => void;
  onDatePickerConfirm: () => void;

  // Status Dropdown
  showStatusDropdown: boolean;
  statusOptions: { value: string; label: string }[];
  selectedStatus: string;
  onStatusSelect: (status: string) => void;
  onStatusDropdownClose: () => void;

  // Sort Dropdown
  showSortDropdown: boolean;
  sortOptions: { value: string; label: string }[];
  selectedSort: string;
  onSortSelect: (sort: string) => void;
  onSortDropdownClose: () => void;
}

export const FilterOverlays: React.FC<FilterOverlaysProps> = ({
  showDatePicker,
  tempDateRange,
  onDateRangeChange,
  onDatePickerClose,
  onDatePickerCancel,
  onDatePickerConfirm,
  showStatusDropdown,
  statusOptions,
  selectedStatus,
  onStatusSelect,
  onStatusDropdownClose,
  showSortDropdown,
  sortOptions,
  selectedSort,
  onSortSelect,
  onSortDropdownClose
}) => {
  return (
    <>
      {/* Date Picker Overlay */}
      {showDatePicker ? (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBackground} onPress={onDatePickerClose} />
          <View style={styles.datePickerOverlay}>
            <SimpleDatePicker
              startDate={tempDateRange.start}
              endDate={tempDateRange.end}
              onDateRangeChange={onDateRangeChange}
              onClose={onDatePickerClose}
            />
            <View style={styles.datePickerActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onDatePickerCancel}
                style={styles.datePickerButton}
              />
              <Button
                title="OK"
                onPress={onDatePickerConfirm}
                style={styles.datePickerButton}
              />
            </View>
          </View>
        </View>
      ) : null}

      {/* Status Dropdown Overlay */}
      {showStatusDropdown ? (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBackground} onPress={onStatusDropdownClose} />
          <View style={styles.dropdownOverlay}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.dropdownItem, selectedStatus === option.value && styles.dropdownItemSelected]}
                onPress={() => onStatusSelect(option.value)}
              >
                <Text style={[styles.dropdownItemText, selectedStatus === option.value && styles.dropdownItemTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {/* Sort Dropdown Overlay */}
      {showSortDropdown ? (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBackground} onPress={onSortDropdownClose} />
          <View style={styles.dropdownOverlay}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.dropdownItem, selectedSort === option.value && styles.dropdownItemSelected]}
                onPress={() => onSortSelect(option.value)}
              >
                <Text style={[styles.dropdownItemText, selectedSort === option.value && styles.dropdownItemTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 120,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.lg,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  datePickerButton: {
    flex: 1,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 120,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.lg,
    overflow: 'hidden',
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});