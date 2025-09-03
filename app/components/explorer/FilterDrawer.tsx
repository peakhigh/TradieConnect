import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
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
}

const { width } = Dimensions.get('window');

export default function FilterDrawer({ visible, onClose, filters, onFiltersChange }: FilterDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<'data' | 'intelligence'>('data');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.drawer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
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

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
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
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: width * 0.85,
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
  applyButton: {
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