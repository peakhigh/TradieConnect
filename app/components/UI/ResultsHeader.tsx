import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pagination } from './Pagination';
import { theme } from '../../theme/theme';

export interface ResultsHeaderProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange
}) => {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <View style={styles.container}>
      {/* Results Count and Pagination */}
      {totalCount > 0 ? (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsCountText}>
            {startIndex + 1}-{endIndex} of {totalCount} records
          </Text>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.md,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCountText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
});