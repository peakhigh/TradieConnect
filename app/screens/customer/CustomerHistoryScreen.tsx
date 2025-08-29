import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { RequestCard } from '../../components/UI/RequestCard';
import { EmptyState } from '../../components/UI/EmptyState';
import { Pagination } from '../../components/UI/Pagination';
import { FilterDrawer } from '../../components/UI/FilterDrawer';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { ServiceRequest } from '../../types';
import { theme } from '../../theme/theme';
import { Filter, Search } from 'lucide-react-native';

type FilterStatus = 'all' | 'active' | 'completed' | 'cancelled';
type SortBy = 'date' | 'urgency' | 'tradeType';

const PAGE_SIZE = 5;

export default function CustomerHistoryScreen() {
  const { user } = useAuth();
  const { serviceRequests } = useUser();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<{start?: Date, end?: Date}>({});
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  
  // Temporary filter states for drawer
  const [tempSearchQuery, setTempSearchQuery] = useState(searchQuery);
  const [tempFilterStatus, setTempFilterStatus] = useState(filterStatus);
  const [tempSortBy, setTempSortBy] = useState(sortBy);
  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [tempShowDatePicker, setTempShowDatePicker] = useState(false);
  
  // Add mock data if no service requests exist
  React.useEffect(() => {
    if (serviceRequests.length === 0) {
      // This would normally come from your data source
      const mockRequests = [
        {
          id: '1',
          tradeType: 'Plumbing',
          description: 'Fix leaking kitchen tap and replace bathroom faucet',
          postcode: '2000',
          urgency: 'high',
          status: 'active',
          createdAt: new Date('2024-01-15'),
          photos: [],
          documents: []
        },
        {
          id: '2', 
          tradeType: 'Electrical',
          description: 'Install new power outlets in living room',
          postcode: '2001',
          urgency: 'medium',
          status: 'completed',
          createdAt: new Date('2024-01-10'),
          photos: [],
          documents: []
        },
        {
          id: '3',
          tradeType: 'Carpentry',
          description: 'Build custom kitchen cabinets and shelving',
          postcode: '2002', 
          urgency: 'low',
          status: 'active',
          createdAt: new Date('2024-01-05'),
          photos: [],
          documents: []
        }
      ];
      // You would set this in your context/state management
    }
  }, [serviceRequests.length]);

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = serviceRequests.filter(request => {
      // Status filter
      if (filterStatus !== 'all' && request.status !== filterStatus) return false;
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTradeType = request.tradeType.toLowerCase().includes(query);
        const matchesDescription = request.description.toLowerCase().includes(query);
        if (!matchesTradeType && !matchesDescription) return false;
      }
      
      // Date range filter
      if (dateRange.start || dateRange.end) {
        const requestDate = new Date(request.createdAt);
        if (dateRange.start && requestDate < dateRange.start) return false;
        if (dateRange.end && requestDate > dateRange.end) return false;
      }
      
      return true;
    });
    
    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'urgency':
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        case 'tradeType':
          return a.tradeType.localeCompare(b.tradeType);
        default:
          return 0;
      }
    });
  }, [serviceRequests, filterStatus, searchQuery, dateRange, sortBy]);
  
  const totalPages = Math.ceil(filteredAndSortedRequests.length / PAGE_SIZE);
  const paginatedRequests = filteredAndSortedRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );





  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Request History</Text>
          <Text style={styles.subtitle}>View all your service requests and their status</Text>
        </View>



        {/* Search and Controls Section */}
        <View style={styles.controlsSection}>
          {/* First Row: Search + Buttons */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Input
                placeholder="Search by trade type or description..."
                value={searchQuery}
                onChangeText={(query) => {
                  setSearchQuery(query.toLowerCase());
                  setCurrentPage(1);
                }}
                style={styles.searchInput}
              />
            </View>
            <TouchableOpacity style={styles.searchButton}>
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
          
          {/* Second Row: Results Count + Pagination */}
          <View style={styles.resultsRow}>
            <Text style={styles.resultsCountText}>
              {filteredAndSortedRequests.length} of {serviceRequests.length} records
            </Text>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </View>
        </View>

        {/* Requests List */}
        {filteredAndSortedRequests.length === 0 ? (
          <EmptyState
            title="No Requests Found"
            message={searchQuery || dateRange.start || dateRange.end 
              ? "No requests match your current filters"
              : "You haven't posted any service requests yet"
            }
          />
        ) : (
          paginatedRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              showEditButton={false}
            />
          ))
        )}




        </View>
        
        {/* Filter Drawer */}
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
            setSearchQuery(tempSearchQuery);
            setFilterStatus(tempFilterStatus);
            setSortBy(tempSortBy);
            setDateRange(tempDateRange);
            setCurrentPage(1);
            setShowFilterDrawer(false);
          }}
          onCancel={() => setShowFilterDrawer(false)}
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

});
