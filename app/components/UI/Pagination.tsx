import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme } from '../../theme/theme';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  // Simple design for 7 or fewer pages
  if (totalPages <= 7) {
    return (
      <View style={styles.pagination}>
        {/* Previous */}
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} color={currentPage === 1 ? theme.colors.text.secondary : theme.colors.primary} />
        </TouchableOpacity>
        
        {/* All page numbers */}
        <View style={styles.pageNumbers}>
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNum = i + 1;
            return (
              <TouchableOpacity
                key={pageNum}
                style={[styles.numberButton, currentPage === pageNum && styles.activePageButton]}
                onPress={() => onPageChange(pageNum)}
              >
                <Text style={[styles.numberButtonText, currentPage === pageNum && styles.activePageText]}>
                  {pageNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Next */}
        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} color={currentPage === totalPages ? theme.colors.text.secondary : theme.colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  // Complex design for more than 7 pages
  return (
    <View style={styles.pagination}>
      {/* First */}
      <TouchableOpacity
        style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
        onPress={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        <Text style={[styles.pageButtonText, currentPage === 1 && styles.disabledText]}>First</Text>
      </TouchableOpacity>
      
      {/* Previous */}
      <TouchableOpacity
        style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} color={currentPage === 1 ? theme.colors.text.secondary : theme.colors.primary} />
      </TouchableOpacity>
      
      {/* Page Numbers */}
      <View style={styles.pageNumbers}>
        {currentPage > 3 && (
          <TouchableOpacity style={styles.numberButton} onPress={() => onPageChange(1)}>
            <Text style={styles.numberButtonText}>1</Text>
          </TouchableOpacity>
        )}
        {currentPage > 4 && (
          <Text style={styles.ellipsis}>...</Text>
        )}
        
        {/* Current page range */}
        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
          if (pageNum > totalPages) return null;
          return (
            <TouchableOpacity
              key={pageNum}
              style={[styles.numberButton, currentPage === pageNum && styles.activePageButton]}
              onPress={() => onPageChange(pageNum)}
            >
              <Text style={[styles.numberButtonText, currentPage === pageNum && styles.activePageText]}>
                {pageNum}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {currentPage < totalPages - 3 && (
          <Text style={styles.ellipsis}>...</Text>
        )}
        {currentPage < totalPages - 2 && (
          <TouchableOpacity style={styles.numberButton} onPress={() => onPageChange(totalPages)}>
            <Text style={styles.numberButtonText}>{totalPages}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Next */}
      <TouchableOpacity
        style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={16} color={currentPage === totalPages ? theme.colors.text.secondary : theme.colors.primary} />
      </TouchableOpacity>
      
      {/* Last */}
      <TouchableOpacity
        style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
        onPress={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        <Text style={[styles.pageButtonText, currentPage === totalPages && styles.disabledText]}>Last</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface,
    minWidth: 44,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderColor: theme.colors.border.light,
  },
  pageButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  disabledText: {
    color: theme.colors.text.secondary,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  numberButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePageButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  numberButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
  activePageText: {
    color: theme.colors.text.inverse,
  },
  ellipsis: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    paddingHorizontal: theme.spacing.xs,
  },
});