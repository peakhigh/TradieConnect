import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { RequestCard } from '../../components/UI/RequestCard';
import { EmptyState } from '../../components/UI/EmptyState';
import { Pagination } from '../../components/UI/Pagination';
import { FilterDrawer } from '../../components/UI/FilterDrawer';
import { RequestCardSkeleton } from '../../components/UI/Skeleton';
import { RequestDetailsDrawer } from '../../components/UI/RequestDetailsDrawer';
import { ImageViewer } from '../../components/UI/ImageViewer';
import { useAuth } from '../../context/AuthContext';
import { ServiceRequest } from '../../types';
import { theme } from '../../theme/theme';
import { Filter, Search } from 'lucide-react-native';
import { collection, query, where, orderBy, limit, startAfter, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../../services/firebase';

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
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tempSearchQuery, setTempSearchQuery] = useState(searchQuery);
  const [tempFilterStatus, setTempFilterStatus] = useState(filterStatus);
  const [tempSortBy, setTempSortBy] = useState(sortBy);
  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [tempShowDatePicker, setTempShowDatePicker] = useState(false);
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
      
      // Add search filter - use array-contains for better search
      if (searchQuery.trim()) {
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
          // Search in multiple fields using array-contains-any
          q = query(q, where('searchKeywords', 'array-contains-any', searchTerms));
        }
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
            <View style={styles.searchRow}>
              <View style={styles.searchContainer}>
                <Input
                  placeholder="Search by trade type or description..."
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={handleSearch}
                  style={styles.searchInput}
                />
              </View>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Search size={20} color={theme.colors.text.inverse} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => {
                  setTempSearchQuery(searchQuery);
                  setTempFilterStatus(filterStatus);
                  setTempSortBy(sortBy);
                  setTempDateRange(dateRange);
                  setShowFilterDrawer(true);
                }}
              >
                <Filter size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.resultsRow}>
              <Text style={styles.resultsCountText}>
                {serviceRequests.length} of {totalCount} records
              </Text>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </View>
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
        <FilterDrawer
          visible={showFilterDrawer}
          onClose={() => setShowFilterDrawer(false)}
          searchQuery={tempSearchQuery}
          filterStatus={tempFilterStatus}
          sortBy={tempSortBy}
          dateRange={tempDateRange}
          showDatePicker={tempShowDatePicker}
          onSearchChange={setTempSearchQuery}
          onStatusChange={setTempFilterStatus}
          onSortChange={setTempSortBy}
          onDateRangeChange={setTempDateRange}
          onToggleDatePicker={() => setTempShowDatePicker(!tempShowDatePicker)}
          onClearDateRange={() => setTempDateRange({})}
          onSubmit={() => {
            setSearchQuery(tempSearchQuery.toLowerCase());
            setFilterStatus(tempFilterStatus);
            setSortBy(tempSortBy);
            setDateRange(tempDateRange);
            setCurrentPage(1);
            setShowFilterDrawer(false);
          }}
          onCancel={() => setShowFilterDrawer(false)}
        />
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 0,
  },
  searchButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface,
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
  clearButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.border.light,
  },
  clearButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },


});
