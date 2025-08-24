import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Container } from '../../components/UI/Container';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { ServiceRequest } from '../../types';
import { theme } from '../../theme/theme';

type FilterStatus = 'all' | 'active' | 'completed' | 'cancelled';
type SortBy = 'date' | 'urgency' | 'tradeType';

export default function CustomerHistoryScreen() {
  const { user } = useAuth();
  const { serviceRequests } = useUser();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const filteredRequests = serviceRequests.filter(request => {
    if (filterStatus === 'all') return true;
    return request.status === filterStatus;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
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

  const handleViewDetails = (request: ServiceRequest) => {
    // TODO: Navigate to detailed view
    Alert.alert('Request Details', `Trade: ${request.tradeType}\nStatus: ${request.status}\nDescription: ${request.description}`);
  };

  const handleContactTradie = (request: ServiceRequest) => {
    // TODO: Navigate to chat
    Alert.alert('Contact Tradie', 'Chat functionality coming soon');
  };

  const handleRateTradie = (request: ServiceRequest) => {
    // TODO: Navigate to rating screen
    Alert.alert('Rate Tradie', 'Rating functionality coming soon');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { text: '#2563eb', bg: '#dbeafe' };
      case 'completed': return { text: '#16a34a', bg: '#dcfce7' };
      case 'cancelled': return { text: '#dc2626', bg: '#fee2e2' };
      case 'in-progress': return { text: '#ca8a04', bg: '#fef3c7' };
      default: return { text: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return { text: '#dc2626', bg: '#fee2e2' };
      case 'medium': return { text: '#ca8a04', bg: '#fef3c7' };
      case 'low': return { text: '#16a34a', bg: '#dcfce7' };
      default: return { text: '#6b7280', bg: '#f3f4f6' };
    }
  };

  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Request History
          </Text>
          <Text style={styles.subtitle}>
            View all your service requests and their status
          </Text>
        </View>

        {/* Filters and Sort */}
        <View style={styles.filtersSection}>
          {/* Status Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Filter by Status</Text>
            <View style={styles.filterButtons}>
              {(['all', 'active', 'in-progress', 'completed', 'cancelled'] as FilterStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    filterStatus === status && styles.selectedFilterButton
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterStatus === status && styles.selectedFilterButtonText
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Sort by</Text>
            <View style={styles.filterButtons}>
              {(['date', 'urgency', 'tradeType'] as SortBy[]).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.filterButton,
                    sortBy === sort && styles.selectedFilterButton
                  ]}
                  onPress={() => setSortBy(sort)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      sortBy === sort && styles.selectedFilterButtonText
                    ]}
                  >
                    {sort === 'date' ? 'Date' : sort === 'urgency' ? 'Urgency' : 'Trade Type'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Results Count */}
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>
            Showing {sortedRequests.length} of {serviceRequests.length} requests
          </Text>
        </View>

        {/* Requests List */}
        {sortedRequests.length === 0 ? (
          <View style={styles.noRequestsContainer}>
            <Text style={styles.noRequestsText}>
              No requests found with the current filters
            </Text>
          </View>
        ) : (
          sortedRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              {/* Header */}
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle}>
                    {request.tradeType}
                  </Text>
                  <Text style={styles.requestDate}>
                    Posted on {new Date(request.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.requestStatusAndUrgency}>
                  <View style={[styles.statusTag, { backgroundColor: getStatusColor(request.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(request.status).text }]}>
                      {request.status}
                    </Text>
                  </View>
                  <View style={[styles.urgencyTag, { backgroundColor: getUrgencyColor(request.urgency).bg }]}>
                    <Text style={[styles.urgencyText, { color: getUrgencyColor(request.urgency).text }]}>
                      {request.urgency}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.requestDescription} numberOfLines={3}>
                {request.description}
              </Text>

              {/* Details */}
              <View style={styles.requestDetails}>
                <Text style={styles.detailLabel}>📍 Suburb:</Text>
                <Text style={styles.detailValue}>{request.suburb}</Text>
                {request.budget && (
                  <>
                    <Text style={styles.detailLabel}>💰 Budget:</Text>
                    <Text style={styles.detailValue}>${request.budget.min} - ${request.budget.max}</Text>
                  </>
                )}
                {request.preferredDates && (
                  <>
                    <Text style={styles.detailLabel}>📅 Preferred:</Text>
                    <Text style={styles.detailValue}>{new Date(request.preferredDates.earliest).toLocaleDateString()} - {new Date(request.preferredDates.latest).toLocaleDateString()}</Text>
                  </>
                )}
              </View>

              {/* Actions */}
              <View style={styles.requestActions}>
                <Button
                  title="View Details"
                  onPress={() => handleViewDetails(request)}
                  variant="outline"
                  size="small"
                />
                
                {request.status === 'active' && (
                  <Button
                    title="Contact Tradie"
                    onPress={() => handleContactTradie(request)}
                    variant="outline"
                    size="small"
                  />
                )}
                
                {request.status === 'completed' && (
                  <Button
                    title="Rate Tradie"
                    onPress={() => handleRateTradie(request)}
                    size="small"
                  />
                )}
              </View>
            </View>
          ))
        )}

        {/* Summary Stats */}
        {serviceRequests.length > 0 && (
          <View style={styles.summaryStatsContainer}>
            <Text style={styles.summaryStatsTitle}>
              Summary
            </Text>
            <View style={styles.summaryStatsContent}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>Total Requests</Text>
                <Text style={styles.summaryStatValue}>{serviceRequests.length}</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>Active</Text>
                <Text style={styles.summaryStatValue}>
                  {serviceRequests.filter(r => r.status === 'active').length}
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>Completed</Text>
                <Text style={styles.summaryStatValue}>
                  {serviceRequests.filter(r => r.status === 'completed').length}
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>In Progress</Text>
                <Text style={styles.summaryStatValue}>
                  {serviceRequests.filter(r => r.status === 'in-progress').length}
                </Text>
              </View>
            </View>
          </View>
        )}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.xxl,
  },
  header: {
    marginBottom: 16, // Tailwind mb-6
  },
  title: {
    fontSize: 24, // Tailwind text-2xl
    fontWeight: 'bold',
    color: '#1f2937', // Tailwind text-gray-900
  },
  subtitle: {
    fontSize: 14, // Tailwind text-gray-600
    color: '#6b7280',
    marginTop: 4,
  },
  filtersSection: {
    marginBottom: 16, // Tailwind mb-6
  },
  filterGroup: {
    marginBottom: 12, // Tailwind mb-4
  },
  filterLabel: {
    fontSize: 14, // Tailwind text-sm
    fontWeight: 'medium',
    color: '#4b5563', // Tailwind text-gray-700
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12, // Tailwind px-3
    paddingVertical: 8, // Tailwind py-2
    borderRadius: 999, // Tailwind rounded-full
    borderWidth: 1,
    borderColor: '#d1d5db', // Tailwind border-gray-300
  },
  selectedFilterButton: {
    backgroundColor: '#3b82f6', // Tailwind bg-primary-600
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14, // Tailwind text-sm
    fontWeight: 'medium',
    color: '#6b7280', // Tailwind text-gray-700
  },
  selectedFilterButtonText: {
    color: '#ffffff', // Tailwind text-white
  },
  resultsCount: {
    marginBottom: 16, // Tailwind mb-4
  },
  resultsCountText: {
    fontSize: 14, // Tailwind text-gray-600
    color: '#6b7280',
  },
  noRequestsContainer: {
    backgroundColor: '#ffffff', // Tailwind bg-white
    borderRadius: 12, // Tailwind rounded-lg
    padding: 24, // Tailwind p-8
    borderWidth: 1,
    borderColor: '#e5e7eb', // Tailwind border-gray-200
  },
  noRequestsText: {
    fontSize: 16, // Tailwind text-gray-500
    color: '#9ca3af',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#ffffff', // Tailwind bg-white
    borderRadius: 12, // Tailwind rounded-lg
    padding: 16, // Tailwind p-4
    borderWidth: 1,
    borderColor: '#e5e7eb', // Tailwind border-gray-200
    marginBottom: 12, // Tailwind mb-4
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12, // Tailwind mb-3
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 18, // Tailwind text-lg
    fontWeight: 'semibold',
    color: '#1f2937', // Tailwind text-gray-900
    marginBottom: 4, // Tailwind mb-1
  },
  requestDate: {
    fontSize: 13, // Tailwind text-gray-600
    color: '#6b7280',
  },
  requestStatusAndUrgency: {
    flexDirection: 'row',
    gap: 8,
  },
  statusTag: {
    paddingHorizontal: 8, // Tailwind px-2
    paddingVertical: 4, // Tailwind py-1
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12, // Tailwind text-xs
    fontWeight: 'medium',
    textTransform: 'capitalize',
  },
  urgencyTag: {
    paddingHorizontal: 8, // Tailwind px-2
    paddingVertical: 4, // Tailwind py-1
    borderRadius: 999,
  },
  urgencyText: {
    fontSize: 12, // Tailwind text-xs
    fontWeight: 'medium',
    textTransform: 'capitalize',
  },
  requestDescription: {
    fontSize: 14, // Tailwind text-gray-700
    color: '#4b5563',
    marginBottom: 12, // Tailwind mb-3
  },
  requestDetails: {
    marginBottom: 12, // Tailwind mb-3
  },
  detailLabel: {
    fontSize: 13, // Tailwind text-sm
    color: '#6b7280',
    marginBottom: 4, // Tailwind mb-1
  },
  detailValue: {
    fontSize: 13, // Tailwind text-sm
    color: '#4b5563',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryStatsContainer: {
    marginTop: 24, // Tailwind mt-6
    backgroundColor: '#ffffff', // Tailwind bg-white
    borderRadius: 12, // Tailwind rounded-lg
    padding: 16, // Tailwind p-4
    borderWidth: 1,
    borderColor: '#e5e7eb', // Tailwind border-gray-200
  },
  summaryStatsTitle: {
    fontSize: 18, // Tailwind text-lg
    fontWeight: 'semibold',
    color: '#1f2937', // Tailwind text-gray-900
    marginBottom: 12, // Tailwind mb-3
  },
  summaryStatsContent: {
    gap: 8, // Tailwind space-y-2
  },
  summaryStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatLabel: {
    fontSize: 14, // Tailwind text-gray-600
    color: '#6b7280',
  },
  summaryStatValue: {
    fontSize: 14, // Tailwind text-gray-600
    fontWeight: 'semibold',
  },
});
