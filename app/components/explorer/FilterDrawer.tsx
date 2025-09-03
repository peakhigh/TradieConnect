import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, ScrollView } from 'react-native';
import { X, Tag } from 'lucide-react-native';
import DataFilters from './DataFilters';
import IntelligenceFilters from './IntelligenceFilters';
import { DataFilters as DataFiltersType, IntelligenceFilters as IntelligenceFiltersType } from '../../types/explorer';

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    data: DataFiltersType;
    intelligence: IntelligenceFiltersType;
  };
  onFiltersChange: (filters: { data: DataFiltersType; intelligence: IntelligenceFiltersType }) => void;
  totalResults?: number;
  onApply: () => void;
}

const { width } = Dimensions.get('window');

export default function FilterDrawer({ visible, onClose, filters, onFiltersChange, totalResults = 0, onApply }: FilterDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<'data' | 'intelligence'>('data');

  const getActiveFilterTags = () => {
    const tags = [];
    
    // Data filters
    if (filters.data.trades.length > 0) {
      tags.push(...filters.data.trades.map(trade => trade.charAt(0).toUpperCase() + trade.slice(1)));
    }
    if (filters.data.location.postcode) {
      tags.push(`${filters.data.location.postcode} (${filters.data.location.radius}km)`);
    }
    if (filters.data.budget.min > 0 || filters.data.budget.max < 5000) {
      tags.push(`$${filters.data.budget.min}-$${filters.data.budget.max}`);
    }
    if (filters.data.urgency.length > 0) {
      tags.push(...filters.data.urgency.map(u => u.charAt(0).toUpperCase() + u.slice(1)));
    }
    if (filters.data.postedWithin < 24) {
      tags.push(`${filters.data.postedWithin}h ago`);
    }
    
    // Intelligence filters
    if (filters.intelligence.competitionLevel !== 'all') {
      tags.push(`${filters.intelligence.competitionLevel.charAt(0).toUpperCase() + filters.intelligence.competitionLevel.slice(1)} competition`);
    }
    if (filters.intelligence.winRateThreshold > 0) {
      tags.push(`${filters.intelligence.winRateThreshold}%+ win rate`);
    }
    if (filters.intelligence.opportunityScore.min > 0 || filters.intelligence.opportunityScore.max < 100) {
      tags.push(`${filters.intelligence.opportunityScore.min}-${filters.intelligence.opportunityScore.max}% opportunity`);
    }
    if (filters.intelligence.priceGap !== 'all') {
      tags.push(`${filters.intelligence.priceGap.charAt(0).toUpperCase() + filters.intelligence.priceGap.slice(1)} price gap`);
    }
    
    return tags;
  };

  const activeFilterTags = getActiveFilterTags();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.drawer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Filters</Text>
              <Text style={styles.resultCount}>({totalResults} results)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>



          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'data' && styles.activeTab]}
              onPress={() => setActiveTab('data')}
            >
              <Text style={[styles.tabText, activeTab === 'data' && styles.activeTabText]}>
                Data Filters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'intelligence' && styles.activeTab]}
              onPress={() => setActiveTab('intelligence')}
            >
              <Text style={[styles.tabText, activeTab === 'intelligence' && styles.activeTabText]}>
                Intelligence
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'data' ? (
              <DataFilters
                filters={filters.data}
                onFiltersChange={(dataFilters) => 
                  onFiltersChange({ ...filters, data: dataFilters })
                }
              />
            ) : (
              <IntelligenceFilters
                filters={filters.intelligence}
                onFiltersChange={(intelligenceFilters) => 
                  onFiltersChange({ ...filters, intelligence: intelligenceFilters })
                }
              />
            )}
          </View>

          {/* Active Filters Section */}
          {activeFilterTags.length > 0 && (
            <View style={styles.activeFiltersFooter}>
              <View style={styles.activeFiltersHeader}>
                <Tag size={14} color="#3b82f6" />
                <Text style={styles.activeFiltersTitle}>Active Filters ({activeFilterTags.length})</Text>
                <TouchableOpacity onPress={() => {
                  const defaultFilters = {
                    data: {
                      trades: [],
                      location: { postcode: '', radius: 10 },
                      budget: { min: 0, max: 5000 },
                      urgency: [],
                      postedWithin: 24
                    },
                    intelligence: {
                      competitionLevel: 'all',
                      winRateThreshold: 0,
                      opportunityScore: { min: 0, max: 100 },
                      priceGap: 'all'
                    }
                  };
                  onFiltersChange(defaultFilters);
                }}>
                  <Text style={styles.clearAllFiltersText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
                {activeFilterTags.map((tag, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.activeFilterChip}
                    onPress={() => {
                      // Remove this specific filter
                      const newFilters = { ...filters };
                      
                      // Logic to remove specific filter based on tag content
                      if (filters.data.trades.some(trade => tag.includes(trade.charAt(0).toUpperCase() + trade.slice(1)))) {
                        newFilters.data.trades = filters.data.trades.filter(trade => 
                          !tag.includes(trade.charAt(0).toUpperCase() + trade.slice(1))
                        );
                      } else if (tag.includes('km)')) {
                        newFilters.data.location = { postcode: '', radius: 10 };
                      } else if (tag.startsWith('$')) {
                        newFilters.data.budget = { min: 0, max: 5000 };
                      } else if (filters.data.urgency.some(u => tag.includes(u.charAt(0).toUpperCase() + u.slice(1)))) {
                        newFilters.data.urgency = filters.data.urgency.filter(u => 
                          !tag.includes(u.charAt(0).toUpperCase() + u.slice(1))
                        );
                      } else if (tag.includes('h ago')) {
                        newFilters.data.postedWithin = 24;
                      } else if (tag.includes('competition')) {
                        newFilters.intelligence.competitionLevel = 'all';
                      } else if (tag.includes('win rate')) {
                        newFilters.intelligence.winRateThreshold = 0;
                      } else if (tag.includes('opportunity')) {
                        newFilters.intelligence.opportunityScore = { min: 0, max: 100 };
                      } else if (tag.includes('price gap')) {
                        newFilters.intelligence.priceGap = 'all';
                      }
                      
                      onFiltersChange(newFilters);
                    }}
                  >
                    <Text style={styles.activeFilterChipText}>{tag}</Text>
                    <X size={12} color="#3b82f6" style={styles.activeFilterChipClose} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={onApply}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: width * 0.85,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  resultCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  activeFiltersFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activeFiltersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 4,
    flex: 1,
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  activeFiltersScroll: {
    flexDirection: 'row',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  activeFilterChipText: {
    fontSize: 11,
    color: '#3b82f6',
    marginRight: 6,
  },
  activeFilterChipClose: {
    marginLeft: 2,
  },
  closeButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#dbeafe',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});