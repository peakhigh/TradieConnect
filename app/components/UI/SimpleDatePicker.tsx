import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme } from '../../theme/theme';

interface SimpleDatePickerProps {
  startDate?: Date;
  endDate?: Date;
  onChange?: (dates: { start?: Date; end?: Date }) => void;
  onDateRangeChange?: (start?: Date, end?: Date) => void;
  onClose?: () => void;
}

export const SimpleDatePicker: React.FC<SimpleDatePickerProps> = ({
  startDate,
  endDate,
  onChange,
  onDateRangeChange
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

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

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isStartDate = (date: Date) => {
    return startDate && date.toDateString() === startDate.toDateString();
  };

  const isEndDate = (date: Date) => {
    return endDate && date.toDateString() === endDate.toDateString();
  };

  const handleDatePress = (date: Date) => {
    if (selectingStart || !startDate) {
      onChange?.({ start: date, end: undefined });
      onDateRangeChange?.(date, undefined);
      setSelectingStart(false);
    } else {
      if (date < startDate) {
        onChange?.({ start: date, end: startDate });
        onDateRangeChange?.(date, startDate);
      } else {
        onChange?.({ start: startDate, end: date });
        onDateRangeChange?.(startDate, date);
      }
      setSelectingStart(true);
    }
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
              date && isStartDate(date) && styles.startDate,
              date && isEndDate(date) && styles.endDate,
              date && isDateInRange(date) && !isStartDate(date) && !isEndDate(date) && styles.inRange
            ]}
            onPress={() => date && handleDatePress(date)}
            disabled={!date}
          >
            {date && (
              <Text style={[
                styles.dayText,
                (isStartDate(date) || isEndDate(date)) && styles.selectedDayText
              ]}>
                {date.getDate()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendText, (startDate && endDate) && styles.legendTextHidden]}>
          {(startDate && endDate) ? 'Dates selected' : selectingStart ? 'Select start date' : 'Select end date'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  dayButton: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 40,
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  startDate: {
    backgroundColor: theme.colors.primary,
    minHeight: 40,
  },
  endDate: {
    backgroundColor: theme.colors.primary,
    minHeight: 40,
  },
  inRange: {
    backgroundColor: theme.colors.primary + '30',
    minHeight: 40,
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
  legend: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  legendText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    minHeight: 20,
  },
  legendTextHidden: {
    color: theme.colors.primary,
    fontStyle: 'normal',
    fontWeight: theme.fontWeight.medium,
  },
});