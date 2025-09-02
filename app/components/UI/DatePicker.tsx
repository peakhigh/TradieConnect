import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { DATE_FORMAT_OPTIONS } from '../../utils/dateUtils';

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
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value && !isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), 1);
    }
    return new Date();
  });

  const formatDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return placeholder;
    }
    return date.toLocaleDateString('en-AU', DATE_FORMAT_OPTIONS);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isSelectedDate = (date: Date) => {
    return value && date.toDateString() === value.toDateString();
  };

  const handleDatePress = (date: Date) => {
    onDateChange(date);
    setShowPicker(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={[styles.dateButton, error && styles.errorInput]}
        onPress={() => {
          if (value && !isNaN(value.getTime())) {
            setCurrentMonth(new Date(value.getFullYear(), value.getMonth(), 1));
          }
          setShowPicker(!showPicker);
        }}
      >
        <Text style={[styles.dateText, (!value || isNaN(value.getTime())) && styles.placeholderText]}>
          {formatDate(value)}
        </Text>
        <Calendar size={20} color={theme.colors.text.secondary} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <View style={styles.pickerContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
              <ChevronLeft size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthYear}>{monthYear}</Text>
            <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
              <ChevronRight size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekDay}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendar}>
            {days.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  !date && styles.emptyDay,
                  date && isSelectedDate(date) && styles.selectedDate
                ]}
                onPress={() => date && handleDatePress(date)}
                disabled={!date}
              >
                {date && (
                  <Text style={[
                    styles.dayText,
                    isSelectedDate(date) && styles.selectedDayText
                  ]}>
                    {date.getDate()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  navButton: {
    padding: theme.spacing.sm,
  },
  monthYear: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
    paddingVertical: theme.spacing.sm,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  selectedDate: {
    backgroundColor: theme.colors.primary,
  },
  dayText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium,
  },
  selectedDayText: {
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.bold,
  },
});