import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import DateTimePicker from 'react-native-ui-datepicker';

interface DatePickerProps {
  label: string;
  value: Date;
  onDateChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  label, 
  value, 
  onDateChange, 
  placeholder = 'Select date',
  error 
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={[styles.dateButton, error && styles.errorInput]}
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Calendar size={20} color={theme.colors.text.secondary} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            mode="single"
            date={value}
            onChange={(params) => {
              if (params.date) {
                onDateChange(new Date(params.date));
                setShowPicker(false);
              }
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.surface,
    minHeight: Platform.OS === 'web' ? 48 : 44,
  },
  dateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
  },
  errorInput: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  pickerContainer: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.md,
  },
});