import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { Container } from '../../components/UI/Container';
import { Filter, TrendingUp, MapPin, Clock, DollarSign, ChevronUp, X, ChevronDown, HelpCircle } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import ServiceRequestCard from '../../components/explorer/ServiceRequestCard';
import FilterDrawer from '../../components/explorer/FilterDrawer';
import { RequestCardSkeleton } from '../../components/UI/Skeleton';
import { HelpDrawer } from '../../components/UI/HelpDrawer';
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
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
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
  const [tempFilters, setTempFilters] = useState<FilterState>(appliedFilters);
  const [totalResults, setTotalResults] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [helpSection, setHelpSection] = useState<'statuses' | 'intelligence' | 'unlock' | 'filters'>('statuses');

  useEffect(() => {
    loadRequests(true);
  }, [activeSort, appliedFilters]);

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
        appliedFilters.data,
        appliedFilters.intelligence,
        activeSort,
        10,
        reset ? null : lastDoc
      );

      if (reset) {
        secureLog(`🆕 Setting ${fetchedRequests.length} requests (reset)`);
        setRequests(fetchedRequests);
        setItemsLoadedInCurrentBatch(fetchedRequests.length);
        setTotalResults(fetchedRequests.length);
        // For demo purposes, assume total available is 3x what we loaded initially
        setTotalAvailable(Math.max(fetchedRequests.length * 3, 100));
      } else {
        secureLog(`➕ Adding ${fetchedRequests.length} requests to existing ${requests.length}`);
        setRequests(prev => {
          const newRequests = [...prev, ...fetchedRequests];
          secureLog(`📊 Total requests after merge: ${newRequests.length}`);
          setTotalResults(newRequests.length);
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

  const getActiveFilterTags = () => {
    const tags = [];
    
    // Data filters
    if (appliedFilters.data.trades.length > 0) {
      tags.push(...appliedFilters.data.trades.map(trade => trade.charAt(0).toUpperCase() + trade.slice(1)));
    }
    if (appliedFilters.data.location.postcode) {
      tags.push(`${appliedFilters.data.location.postcode} (${appliedFilters.data.location.radius}km)`);
    }
    if (appliedFilters.data.budget.min > 0 || appliedFilters.data.budget.max < 5000) {
      tags.push(`$${appliedFilters.data.budget.min}-$${appliedFilters.data.budget.max}`);
    }
    if (appliedFilters.data.urgency.length > 0) {
      tags.push(...appliedFilters.data.urgency.map(u => u.charAt(0).toUpperCase() + u.slice(1)));
    }
    if (appliedFilters.data.postedWithin < 24) {
      tags.push(`${appliedFilters.data.postedWithin}h ago`);
    }
    
    // Intelligence filters
    if (appliedFilters.intelligence.competitionLevel !== 'all') {
      tags.push(`${appliedFilters.intelligence.competitionLevel.charAt(0).toUpperCase() + appliedFilters.intelligence.competitionLevel.slice(1)} competition`);
    }
    if (appliedFilters.intelligence.winRateThreshold > 0) {
      tags.push(`${appliedFilters.intelligence.winRateThreshold}%+ win rate`);
    }
    if (appliedFilters.intelligence.opportunityScore.min > 0 || appliedFilters.intelligence.opportunityScore.max < 100) {
      tags.push(`${appliedFilters.intelligence.opportunityScore.min}-${appliedFilters.intelligence.opportunityScore.max}% opportunity`);
    }
    if (appliedFilters.intelligence.priceGap !== 'all') {
      tags.push(`${appliedFilters.intelligence.priceGap.charAt(0).toUpperCase() + appliedFilters.intelligence.priceGap.slice(1)} price gap`);
    }
    
    return tags;
  };

  const clearFilter = (tagIndex: number) => {
    const tags = getActiveFilterTags();
    const tagToRemove = tags[tagIndex];
    
    // Reset specific filter based on tag content
    const newFilters = { ...appliedFilters };
    
    // Check data filters
    if (appliedFilters.data.trades.some(trade => tagToRemove.includes(trade.charAt(0).toUpperCase() + trade.slice(1)))) {
      newFilters.data.trades = appliedFilters.data.trades.filter(trade => 
        !tagToRemove.includes(trade.charAt(0).toUpperCase() + trade.slice(1))
      );
    } else if (tagToRemove.includes('km)')) {
      newFilters.data.location = { postcode: '', radius: 10 };
    } else if (tagToRemove.startsWith('$')) {
      newFilters.data.budget = { min: 0, max: 5000 };
    } else if (appliedFilters.data.urgency.some(u => tagToRemove.includes(u.charAt(0).toUpperCase() + u.slice(1)))) {
      newFilters.data.urgency = appliedFilters.data.urgency.filter(u => 
        !tagToRemove.includes(u.charAt(0).toUpperCase() + u.slice(1))
      );
    } else if (tagToRemove.includes('h ago')) {
      newFilters.data.postedWithin = 24;
    }
    // Check intelligence filters
    else if (tagToRemove.includes('competition')) {
      newFilters.intelligence.competitionLevel = 'all';
    } else if (tagToRemove.includes('win rate')) {
      newFilters.intelligence.winRateThreshold = 0;
    } else if (tagToRemove.includes('opportunity')) {
      newFilters.intelligence.opportunityScore = { min: 0, max: 100 };
    } else if (tagToRemove.includes('price gap')) {
      newFilters.intelligence.priceGap = 'all';
    }
    
    setAppliedFilters(newFilters);
    setTempFilters(newFilters);
  };

  const clearAllFilters = () => {
    const defaultFilters: FilterState = {
      data: {
        trades: [],
        location: { postcode: '', radius: 10 },
        budget: { min: 0, max: 5000 },
        urgency: [],
        postedWithin: 24
      },
      intelligence: {
        competitionLevel: 'all' as const,
        winRateThreshold: 0,
        opportunityScore: { min: 0, max: 100 },
        priceGap: 'all' as const
      }
    };
    setAppliedFilters(defaultFilters);
    setTempFilters(defaultFilters);
  };

  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    setShowFilterDrawer(false);
  };

  const handleFilterDrawerClose = () => {
    setTempFilters(appliedFilters); // Reset temp filters to applied state
    setShowFilterDrawer(false);
  };

  const activeFilterTags = getActiveFilterTags();

  return (
    <Container style={styles.container} scrollable={false}>
      {/* Header with Sort & Filter */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Service Requests</Text>
            <TouchableOpacity 
              onPress={() => {
                setHelpSection('statuses');
                setShowHelpDrawer(true);
              }}
              style={styles.helpButton}
            >
              <HelpCircle size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          <Text style={styles.resultCount}>
            {loading && requests.length === 0 
              ? 'Loading...' 
              : totalResults === 0 
                ? '0 results'
                : totalResults < 10
                  ? `${totalResults} of ${totalAvailable}`
                  : `${Math.max(1, totalResults - 9)} to ${totalResults} of ${totalAvailable}`
            }
          </Text>
        </View>
        
        {/* Filter and Sort Row */}
        <View style={styles.filterSortRow}>
          {/* Filter Section */}
          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterButton, activeFilterTags.length > 0 && styles.activeFilterButton]}
                onPress={() => setShowFilterDrawer(true)}
              >
                <Filter size={16} color={activeFilterTags.length > 0 ? "#ffffff" : "#6b7280"} />
                <Text style={[styles.filterButtonText, activeFilterTags.length > 0 && styles.activeFilterButtonText]}>
                  Filters {activeFilterTags.length > 0 && `(${activeFilterTags.length})`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setHelpSection('filters');
                  setShowHelpDrawer(true);
                }}
                style={styles.filterHelpButton}
              >
                <HelpCircle size={14} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort Section */}
          <View style={styles.sortSection}>
            <View style={styles.sortDropdownContainer}>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setShowSortDropdown(!showSortDropdown)}
              >
                <Text style={styles.sortButtonText}>
                  {SORT_OPTIONS.find(opt => opt.key === activeSort)?.label || 'Sort'}
                </Text>
                <ChevronDown size={16} color="#6b7280" />
              </TouchableOpacity>
            
              {showSortDropdown && (
                <View style={styles.sortDropdown}>
                  {SORT_OPTIONS.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.sortOption,
                          activeSort === option.key && styles.activeSortOption
                        ]}
                        onPress={() => {
                          setActiveSort(option.key);
                          setShowSortDropdown(false);
                        }}
                      >
                        <IconComponent 
                          size={14} 
                          color={activeSort === option.key ? '#3b82f6' : '#6b7280'} 
                        />
                        <Text style={[
                          styles.sortOptionText,
                          activeSort === option.key && styles.activeSortOptionText
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      
      {/* Active Filter Tags */}
      {activeFilterTags.length > 0 && (
        <View style={styles.filterTagsContainer}>
          <View style={styles.tagsScrollContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTagsScroll}>
              {activeFilterTags.map((tag, index) => (
                <View key={index} style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => clearFilter(index)} style={styles.filterTagClose}>
                    <X size={12} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            {activeFilterTags.length > 3 && (
              <View style={styles.scrollIndicator}>
                <View style={styles.scrollDot} />
                <View style={styles.scrollDot} />
                <View style={styles.scrollDot} />
              </View>
            )}
          </View>
          <View style={styles.separator} />
          <TouchableOpacity 
            style={styles.clearAllTagButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.clearAllTagText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        visible={showFilterDrawer}
        onClose={handleFilterDrawerClose}
        filters={tempFilters}
        onFiltersChange={setTempFilters}
        totalResults={totalResults}
        onApply={applyFilters}
      />

      {/* Help Drawer */}
      <HelpDrawer
        visible={showHelpDrawer}
        onClose={() => setShowHelpDrawer(false)}
        section={helpSection}
      />

      {/* Sort Dropdown Backdrop */}
      {showSortDropdown && (
        <TouchableOpacity
          style={styles.sortBackdrop}
          onPress={() => setShowSortDropdown(false)}
          activeOpacity={1}
        />
      )}

      {/* Request List */}
      {loading && requests.length === 0 ? (
        <View style={styles.skeletonContainer}>
          <RequestCardSkeleton />
          <RequestCardSkeleton />
          <RequestCardSkeleton />
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
              onHelp={(section) => {
                setHelpSection(section);
                setShowHelpDrawer(true);
              }}
              isSaved={savedRequests.has(item.id)}
              sequenceNumber={index + 1}
            />
          )}
          onEndReached={handleAutoLoadMore}
          onEndReachedThreshold={0.1}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={() => (
            <View style={styles.footer}>
              {loadingMore && (
                <Text style={styles.loadingText}>Loading more...</Text>
              )}
              {showLoadMoreButton && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                >
                  <Text style={styles.loadMoreText}>
                    {loadingMore ? 'Loading...' : 'Load More Items'}
                  </Text>
                </TouchableOpacity>
              )}
              {!hasMore && requests.length > 0 && (
                <Text style={styles.endText}>No more requests available</Text>
              )}
            </View>
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
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 1003,
    position: 'relative',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  helpButton: {
    marginLeft: 6,
    padding: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  resultCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterSortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  filterSection: {
    alignItems: 'flex-start',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterHelpButton: {
    padding: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  sortSection: {
    alignItems: 'flex-end',
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginBottom: 8,
    marginLeft: 8,
  },
  clearAllButtonDisabled: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  clearAllLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  clearAllLabelActive: {
    color: '#dc2626',
  },
  clearAllLabelDisabled: {
    color: '#9ca3af',
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
    marginRight: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  filterTagsContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsScrollContainer: {
    flex: 1,
    position: 'relative',
  },
  filterTagsScroll: {
    flex: 1,
  },
  scrollIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    gap: 2,
  },
  scrollDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9ca3af',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  clearAllTagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearAllTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  filterTagText: {
    fontSize: 12,
    color: '#3b82f6',
    marginRight: 4,
  },
  filterTagClose: {
    padding: 2,
  },


  sortDropdownContainer: {
    position: 'relative',
    zIndex: 1001,
    alignItems: 'flex-end',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sortDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1002,
    marginTop: 8,
    minWidth: 200,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activeSortOption: {
    backgroundColor: '#eff6ff',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 16,
    flex: 1,
  },
  activeSortOptionText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  endText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  sortBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3b82f6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});