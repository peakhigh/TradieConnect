import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { RequestCard } from '../../components/UI/RequestCard';
import { EmptyState } from '../../components/UI/EmptyState';
import { Pagination } from '../../components/UI/Pagination';
import { RequestCardSkeleton } from '../../components/UI/Skeleton';
import { RequestDetailsDrawer } from '../../components/UI/RequestDetailsDrawer';
import { ImageViewer } from '../../components/UI/ImageViewer';
import { SimpleDatePicker } from '../../components/UI/SimpleDatePicker';
import { useAuth } from '../../context/AuthContext';
import { ServiceRequest } from '../../types';
import { theme } from '../../theme/theme';
import { Search, Calendar, ChevronDown, X } from 'lucide-react-native';
import { collection, query, where, orderBy, limit, startAfter, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

type FilterStatus = 'all' | 'active' | 'completed' | 'cancelled';
type SortBy = 'date' | 'urgency' | 'tradeType';

const PAGE_SIZE = 5;

export default function CustomerHistoryScreen() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<{start?: Date, end?: Date}>({});
  const [loading, setLoading] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<{start?: Date, end?: Date}>({});
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedRequestPhotos, setSelectedRequestPhotos] = useState<string[]>([]);

  const fetchRequests = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      let q = query(
        collection(db, 'serviceRequests'),
        where('customerId', '==', user.id)
      );
      
      // Add status filter
      if (filterStatus !== 'all') {
        q = query(q, where('status', '==', filterStatus));
      }
      
      // Add search filter - search in notes words and trade type
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.toLowerCase();
        // Search for the term in searchKeywords array
        q = query(q, where('searchKeywords', 'array-contains', searchTerm));
      }
      
      // Add date range filter
      if (dateRange.start) {
        q = query(q, where('createdAt', '>=', dateRange.start));
      }
      if (dateRange.end) {
        q = query(q, where('createdAt', '<=', dateRange.end));
      }
      
      // Add sorting
      switch (sortBy) {
        case 'date':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'urgency':
          q = query(q, orderBy('urgency', 'desc'));
          break;
        case 'tradeType':
          q = query(q, orderBy('tradeType', 'asc'));
          break;
      }
      
      // Get total count
      const countSnapshot = await getCountFromServer(q);
      setTotalCount(countSnapshot.data().count);
      
      // Add pagination
      const offset = (currentPage - 1) * PAGE_SIZE;
      if (offset > 0) {
        // For pagination, we need to get documents up to the offset
        const offsetQuery = query(q, limit(offset));
        const offsetSnapshot = await getDocs(offsetQuery);
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }
      }
      
      q = query(q, limit(PAGE_SIZE));
      
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ServiceRequest[];
      
      setServiceRequests(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequests();
  }, [user?.id, filterStatus, searchQuery, dateRange, sortBy, currentPage]);
  
  useFocusEffect(
    React.useCallback(() => {
      setCurrentPage(1);
      fetchRequests();
    }, [])
  );
  
  const handleSearch = () => {
    setSearchQuery(searchInput.toLowerCase());
    setCurrentPage(1);
  };
  
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Request History</Text>
            <Text style={styles.subtitle}>View all your service requests and their status</Text>
          </View>
          <View style={styles.controlsSection}>
            {/* Clear All Button */}
            <View style={styles.clearAllContainer}>
              <TouchableOpacity 
                onPress={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setFilterStatus('all');
                  setDateRange({});
                  setSortBy('date');
                  setCurrentPage(1);
                }}
                style={[
                  styles.clearAllButton,
                  !(searchQuery || filterStatus !== 'all' || dateRange.start || dateRange.end || sortBy !== 'date') && styles.clearAllHidden
                ]}
              >
                <Text style={styles.clearAllText}>Clear all filters</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Tags Row */}
            <View style={styles.filterTagsRow}>
              {/* Date Filter Tag */}
              <TouchableOpacity 
                style={[styles.filterTag, styles.dateFilterTag]}
                onPress={() => {
                  setTempDateRange(dateRange);
                  setShowDatePicker(!showDatePicker);
                }}
              >
                <View style={styles.filterTagContent}>
                  <View style={styles.filterTagHeader}>
                    <Calendar size={16} color={theme.colors.primary} />
                    <Text style={styles.filterTagTitle}>Dates</Text>
                    {(dateRange.start || dateRange.end) ? (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          setDateRange({});
                          setCurrentPage(1);
                        }}
                        style={styles.filterTagClose}
                      >
                        <X size={14} color={theme.colors.primary} />
                      </TouchableOpacity>
                    ) : (
                      <ChevronDown size={14} color={theme.colors.primary} />
                    )}
                  </View>
                  <Text style={styles.filterTagValue}>
                    {dateRange.start || dateRange.end 
                      ? `${dateRange.start?.toLocaleDateString() || 'Start'} - ${dateRange.end?.toLocaleDateString() || 'End'}`
                      : 'All'
                    }
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Status Filter Tag */}
              <TouchableOpacity 
                style={styles.filterTag}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <View style={styles.filterTagContent}>
                  <View style={styles.filterTagHeader}>
                    <Text style={styles.filterTagTitle}>Status</Text>
                    {filterStatus !== 'all' ? (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          setFilterStatus('all');
                          setCurrentPage(1);
                        }}
                        style={styles.filterTagClose}
                      >
                        <X size={14} color={theme.colors.primary} />
                      </TouchableOpacity>
                    ) : (
                      <ChevronDown size={14} color={theme.colors.primary} />
                    )}
                  </View>
                  <Text style={styles.filterTagValue}>
                    {filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Sort Filter Tag */}
              <TouchableOpacity 
                style={styles.filterTag}
                onPress={() => setShowSortDropdown(!showSortDropdown)}
              >
                <View style={styles.filterTagContent}>
                  <View style={styles.filterTagHeader}>
                    <Text style={styles.filterTagTitle}>Sort</Text>
                    {sortBy !== 'date' ? (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          setSortBy('date');
                          setCurrentPage(1);
                        }}
                        style={styles.filterTagClose}
                      >
                        <X size={14} color={theme.colors.primary} />
                      </TouchableOpacity>
                    ) : (
                      <ChevronDown size={14} color={theme.colors.primary} />
                    )}
                  </View>
                  <Text style={styles.filterTagValue}>
                    {sortBy === 'date' ? 'Date' : sortBy === 'urgency' ? 'Urgency' : 'Trade Type'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <Input
                  placeholder="Search by trade type or description..."
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={handleSearch}
                  style={styles.searchInputWithIcon}
                />
                {searchInput ? (
                  <TouchableOpacity 
                    style={styles.clearIconButton} 
                    onPress={() => {
                      setSearchInput('');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                  >
                    <Text style={styles.clearIcon}>×</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Search size={20} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            </View>
            <View style={styles.resultsRow}>
              <Text style={styles.resultsCountText}>
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} records
              </Text>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </View>
            {searchQuery ? (
              <View style={styles.activeFilters}>
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>Search: {searchQuery}</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setSearchInput('');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    style={styles.activeFilterClose}
                  >
                    <X size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
          {loading ? (
            <View>
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <RequestCardSkeleton key={index} />
              ))}
            </View>
          ) : serviceRequests.length === 0 ? (
            <EmptyState
              title="No Requests Found"
              message={searchQuery || dateRange.start || dateRange.end 
                ? "No requests match your current filters"
                : "You haven't posted any service requests yet"
              }
            />
          ) : (
            serviceRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                showEditButton={false}
                onViewDetails={(req) => {
                  setSelectedRequest(req);
                  setShowRequestDetails(true);
                }}
                onPhotoPress={(photoIndex, req) => {
                  setSelectedPhotoIndex(photoIndex);
                  setSelectedRequestPhotos(req.photos || []);
                  setShowImageViewer(true);
                }}
              />
            ))
          )}
        </View>

        <RequestDetailsDrawer
          visible={showRequestDetails}
          onClose={() => setShowRequestDetails(false)}
          request={selectedRequest}
        />
        <ImageViewer
          visible={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          images={selectedRequestPhotos}
          initialIndex={selectedPhotoIndex}
        />
      </ScrollView>
      
      {/* Overlays */}
      {showDatePicker ? (
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.overlayBackground} 
            onPress={() => setShowDatePicker(false)}
          />
          <View style={styles.datePickerOverlay}>
            <SimpleDatePicker
              startDate={tempDateRange.start}
              endDate={tempDateRange.end}
              onDateRangeChange={(start, end) => {
                setTempDateRange({ start, end });
              }}
              onClose={() => setShowDatePicker(false)}
            />
            <View style={styles.datePickerActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setTempDateRange({});
                  setShowDatePicker(false);
                }}
                style={styles.datePickerButton}
              />
              <Button
                title="OK"
                onPress={() => {
                  setDateRange(tempDateRange);
                  setCurrentPage(1);
                  setShowDatePicker(false);
                }}
                style={styles.datePickerButton}
              />
            </View>
          </View>
        </View>
      ) : null}

      {showStatusDropdown ? (
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.overlayBackground} 
            onPress={() => setShowStatusDropdown(false)}
          />
          <View style={styles.dropdownOverlay}>
            {(['all', 'active', 'completed', 'cancelled'] as FilterStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.dropdownItem, filterStatus === status && styles.dropdownItemSelected]}
                onPress={() => {
                  setFilterStatus(status);
                  setShowStatusDropdown(false);
                  setCurrentPage(1);
                }}
              >
                <Text style={[styles.dropdownItemText, filterStatus === status && styles.dropdownItemTextSelected]}>
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {showSortDropdown ? (
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.overlayBackground} 
            onPress={() => setShowSortDropdown(false)}
          />
          <View style={styles.dropdownOverlay}>
            {(['date', 'urgency', 'tradeType'] as SortBy[]).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[styles.dropdownItem, sortBy === sort && styles.dropdownItemSelected]}
                onPress={() => {
                  setSortBy(sort);
                  setShowSortDropdown(false);
                  setCurrentPage(1);
                }}
              >
                <Text style={[styles.dropdownItemText, sortBy === sort && styles.dropdownItemTextSelected]}>
                  {sort === 'date' ? 'Date' : sort === 'urgency' ? 'Urgency' : 'Trade Type'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.xxl : theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },

  controlsSection: {
    flexDirection: 'column',
    marginBottom: theme.spacing.lg,
  },
  filterTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filterTag: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 48,
    minWidth: 100,
  },
  dateFilterTag: {
    flex: 1.5,
  },
  filterTagContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  filterTagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  filterTagTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  filterTagValue: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  filterTagClose: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  datePickerButton: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 120,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.lg,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 120,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.lg,
    overflow: 'hidden',
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    gap: theme.spacing.xs,
  },
  activeFilterText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  activeFilterClose: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInputWithIcon: {
    marginBottom: 0,
    paddingRight: 40,
  },
  clearIconButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    fontSize: 20,
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
  },
  searchButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
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

  clearButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
  clearAllContainer: {
    alignItems: 'flex-end',
    minHeight: 24,
    marginBottom: theme.spacing.xs,
  },
  clearAllButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  clearAllHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  clearAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },


});
