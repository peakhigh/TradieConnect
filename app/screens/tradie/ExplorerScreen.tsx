import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { Container } from '../../components/UI/Container';
import { Filter, TrendingUp, MapPin, Clock, DollarSign, ChevronUp } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import ServiceRequestCard from '../../components/explorer/ServiceRequestCard';
import FilterDrawer from '../../components/explorer/FilterDrawer';
import { EnrichedServiceRequest, DataFilters as DataFiltersType, IntelligenceFilters as IntelligenceFiltersType } from '../../types/explorer';
import { fetchServiceRequests, unlockServiceRequest } from '../../services/explorerService';
import { secureLog, secureError } from '../../utils/logger';

// Combined filter state
interface FilterState {
  data: DataFiltersType;
  intelligence: IntelligenceFiltersType;
}

interface SortOption {
  key: string;
  label: string;
  icon: any;
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'newest', label: 'Newest', icon: Clock },
  { key: 'opportunity', label: 'Best Opportunity', icon: TrendingUp },
  { key: 'closest', label: 'Closest', icon: MapPin },
  { key: 'budget', label: 'Highest Budget', icon: DollarSign },
];

export default function ExplorerScreen() {
  const [activeSort, setActiveSort] = useState('newest');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [requests, setRequests] = useState<EnrichedServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);
  const [itemsLoadedInCurrentBatch, setItemsLoadedInCurrentBatch] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [flatListRef, setFlatListRef] = useState<any>(null);
  const [savedRequests, setSavedRequests] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
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
  });

  useEffect(() => {
    loadRequests(true);
  }, [activeSort, filters]);

  const loadRequests = async (reset = false) => {
    try {
      secureLog(`🔄 loadRequests called:`, {
        reset,
        currentRequestsCount: requests.length,
        itemsLoadedInCurrentBatch,
        hasMore,
        showLoadMoreButton,
        lastDocId: lastDoc?.id || 'none'
      });
      
      if (reset) {
        secureLog('🆕 Resetting state for fresh load');
        setLoading(true);
        setRequests([]);
        setLastDoc(null);
        setHasMore(true);
        setShowLoadMoreButton(false);
        setItemsLoadedInCurrentBatch(0);
      } else {
        secureLog('🔄 Loading more items...');
        setLoadingMore(true);
      }

      const { requests: fetchedRequests, hasMore: moreAvailable, lastDoc: newLastDoc } = await fetchServiceRequests(
        filters.data,
        filters.intelligence,
        activeSort,
        10,
        reset ? null : lastDoc
      );

      if (reset) {
        secureLog(`🆕 Setting ${fetchedRequests.length} requests (reset)`);
        setRequests(fetchedRequests);
        setItemsLoadedInCurrentBatch(fetchedRequests.length);
      } else {
        secureLog(`➕ Adding ${fetchedRequests.length} requests to existing ${requests.length}`);
        setRequests(prev => {
          const newRequests = [...prev, ...fetchedRequests];
          secureLog(`📊 Total requests after merge: ${newRequests.length}`);
          return newRequests;
        });
        const newBatchCount = itemsLoadedInCurrentBatch + fetchedRequests.length;
        secureLog(`📊 Batch count: ${itemsLoadedInCurrentBatch} + ${fetchedRequests.length} = ${newBatchCount}`);
        setItemsLoadedInCurrentBatch(newBatchCount);
      }
      
      setHasMore(moreAvailable);
      setLastDoc(newLastDoc);
      
      // Show "Load More" button after every 50 items in current batch
      const currentBatchCount = reset ? fetchedRequests.length : itemsLoadedInCurrentBatch + fetchedRequests.length;
      const shouldShowButton = moreAvailable && currentBatchCount >= 50;
      secureLog(`🔘 Load More Button Logic:`, {
        currentBatchCount,
        moreAvailable,
        shouldShowButton,
        threshold: 50
      });
      setShowLoadMoreButton(shouldShowButton);
      
    } catch (error) {
      console.error('Full error object:', error);
      secureError('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load service requests');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    secureLog(`🔘 handleLoadMore clicked:`, {
      loadingMore,
      hasMore,
      currentBatchCount: itemsLoadedInCurrentBatch,
      totalRequests: requests.length
    });
    
    if (!loadingMore && hasMore) {
      secureLog('✅ Proceeding with load more - resetting batch counter');
      setShowLoadMoreButton(false);
      setItemsLoadedInCurrentBatch(0); // Reset batch counter BEFORE loading
      loadRequests(false);
    } else {
      secureLog('❌ Load more blocked:', { loadingMore, hasMore });
    }
  };

  const handleAutoLoadMore = () => {
    // Auto-load more when scrolling, but only if button is not shown
    const canAutoLoad = !loadingMore && hasMore && !showLoadMoreButton && itemsLoadedInCurrentBatch < 50;
    
    secureLog(`🔄 handleAutoLoadMore triggered:`, {
      loadingMore,
      hasMore,
      showLoadMoreButton,
      itemsLoadedInCurrentBatch,
      canAutoLoad
    });
    
    if (canAutoLoad) {
      secureLog('✅ Auto-loading more items');
      loadRequests(false);
    }
  };

  const handleUnlock = async (requestId: string) => {
    try {
      // Mock tradie ID - in real app, get from auth context
      const tradieId = 'tradie_1';
      const unlockedRequest = await unlockServiceRequest(requestId, tradieId);
      setRequests(prev => 
        prev.map(req => req.id === requestId ? unlockedRequest : req)
      );
      Alert.alert('Success', 'Request unlocked! Full details now available.');
    } catch (error) {
      secureError('Error unlocking request:', error);
      Alert.alert('Error', 'Failed to unlock request');
    }
  };

  const handleSave = (requestId: string) => {
    setSavedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const scrollToTop = () => {
    flatListRef?.scrollToOffset({ animated: true, offset: 0 });
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > 500);
  };

  return (
    <Container style={styles.container} scrollable={false}>
      {/* Header with Sort & Filter */}
      <View style={styles.header}>
        <Text style={styles.title}>Service Requests</Text>
        
        {/* Compact Sort Bar */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.sortContainer}
        >
          {SORT_OPTIONS.map((option) => {
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortChip,
                  activeSort === option.key && styles.activeSortChip
                ]}
                onPress={() => setActiveSort(option.key)}
              >
                <IconComponent 
                  size={14} 
                  color={activeSort === option.key ? '#ffffff' : '#6b7280'} 
                />
                <Text style={[
                  styles.sortText,
                  activeSort === option.key && styles.activeSortText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filter Toggle */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterDrawer(true)}
        >
          <Filter size={16} color="#6b7280" />
          <Text style={styles.filterButtonText}>
            Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Drawer */}
      <FilterDrawer
        visible={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Request List */}
      {loading && requests.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading service requests...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No service requests found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          ref={setFlatListRef}
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ServiceRequestCard
              request={item}
              onUnlock={handleUnlock}
              onSave={handleSave}
              isSaved={savedRequests.has(item.id)}
              sequenceNumber={index + 1}
            />
          )}
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => loadRequests(true)}
          onEndReached={showLoadMoreButton ? undefined : handleAutoLoadMore}
          onEndReachedThreshold={0.1}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListFooterComponent={() => (
            showLoadMoreButton ? (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                >
                  <Text style={styles.loadMoreText}>
                    {loadingMore ? 'Loading...' : 'Load More Items'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : loadingMore ? (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          )}
        />
      )}
      
      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <TouchableOpacity
          style={styles.scrollToTopButton}
          onPress={scrollToTop}
        >
          <ChevronUp size={20} color="#ffffff" />
        </TouchableOpacity>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sortContainer: {
    marginBottom: 12,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeSortChip: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  activeSortText: {
    color: '#ffffff',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: '#6b7280',
    fontSize: 14,
  },

  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});