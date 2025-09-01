import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';
import { COMMON_TRADES, ALL_TRADES } from '../../config/trades';


interface TradeSelectorProps {
  selectedTrades: string[];
  onTradesChange: (trades: string[]) => void;
  error?: string;
}

export const TradeSelector: React.FC<TradeSelectorProps> = ({ selectedTrades, onTradesChange, error }) => {
  const [showAllTrades, setShowAllTrades] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleTrade = (trade: string) => {
    if (selectedTrades.includes(trade)) {
      onTradesChange(selectedTrades.filter(t => t !== trade));
    } else {
      onTradesChange([...selectedTrades, trade]);
    }
  };

  const filteredTrades = ALL_TRADES.filter(trade => 
    trade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View>
      {/* Common Trades */}
      <Text style={styles.subSectionTitle}>Popular Trades</Text>
      <View style={styles.tradesGrid}>
        {COMMON_TRADES.map((trade) => {
          const isSelected = selectedTrades.includes(trade);
          return (
            <TouchableOpacity
              key={trade}
              style={[styles.tradeButton, isSelected && styles.tradeButtonSelected]}
              onPress={() => toggleTrade(trade)}
            >
              <Text style={[styles.tradeButtonText, isSelected && styles.tradeButtonTextSelected]}>
                {trade}
              </Text>
              {isSelected && <Text style={styles.removeIconText}>×</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Non-Common Trades */}
      {selectedTrades.filter(trade => !COMMON_TRADES.includes(trade)).length > 0 && (
        <View>
          <Text style={styles.subSectionTitle}>Selected Other Trades</Text>
          <View style={styles.tradesGrid}>
            {selectedTrades
              .filter(trade => !COMMON_TRADES.includes(trade))
              .map((trade) => (
                <TouchableOpacity
                  key={trade}
                  style={[styles.tradeButton, styles.tradeButtonSelected]}
                  onPress={() => toggleTrade(trade)}
                >
                  <Text style={[styles.tradeButtonText, styles.tradeButtonTextSelected]}>
                    {trade}
                  </Text>
                  <Text style={styles.removeIconText}>×</Text>
                </TouchableOpacity>
              ))
            }
          </View>
        </View>
      )}

      {/* More Trades Button */}
      <TouchableOpacity 
        style={styles.moreTradesButton} 
        onPress={() => {
          setSearchTerm('');
          setShowAllTrades(true);
        }}
      >
        <Text style={styles.moreTradesButtonText}>{`+ More Trades (${ALL_TRADES.length - COMMON_TRADES.length} more)`}</Text>
      </TouchableOpacity>

      {/* Selected Count */}
      {selectedTrades.length > 0 && (
        <Text style={styles.selectedCount}>
          {`${selectedTrades.length} trade${selectedTrades.length !== 1 ? 's' : ''} selected`}
        </Text>
      )}
      
      {error ? <Text style={styles.errorText}>{String(error)}</Text> : null}

      {/* All Trades Modal */}
      <Modal visible={showAllTrades} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Trades</Text>
            <TouchableOpacity onPress={() => setShowAllTrades(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search trades..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />

          <ScrollView style={styles.modalContent}>
            {filteredTrades.map((trade) => {
              const isSelected = selectedTrades.includes(trade);
              return (
                <TouchableOpacity
                  key={trade}
                  style={[styles.tradeListItem, isSelected && styles.tradeListItemSelected]}
                  onPress={() => toggleTrade(trade)}
                >
                  <Text style={[styles.tradeListText, isSelected && styles.tradeListTextSelected]}>
                    {trade}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  subSectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  tradesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  tradeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tradeButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tradeButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  tradeButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  removeIconText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  moreTradesButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed',
    marginBottom: theme.spacing.sm,
  },
  moreTradesButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  selectedCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  modalClose: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  searchInput: {
    margin: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    backgroundColor: theme.colors.surface,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  tradeListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  tradeListItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  tradeListText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  tradeListTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  checkmark: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
  },
});