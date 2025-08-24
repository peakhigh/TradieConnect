import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { Quote } from '../../types';

type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected';
type SortBy = 'date' | 'amount' | 'status';

export default function TradieHistoryScreen() {
  const { user } = useAuth();
  const { quotes } = useUser();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const filteredQuotes = quotes.filter(quote => {
    if (filterStatus === 'all') return true;
    return quote.status === filterStatus;
  });

  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'amount':
        return b.amount - a.amount;
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const handleViewDetails = (quote: Quote) => {
    // TODO: Navigate to detailed view
    Alert.alert('Quote Details', `Amount: $${quote.amount}\nStatus: ${quote.status}\nNotes: ${quote.notes}`);
  };

  const handleChatWithCustomer = (quote: Quote) => {
    // TODO: Navigate to chat
    Alert.alert('Chat with Customer', 'Chat functionality coming soon');
  };

  const handleViewServiceRequest = (quote: Quote) => {
    // TODO: Navigate to service request details
    Alert.alert('Service Request', 'Service request details coming soon');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { text: '#ca8a04', bg: '#fef3c7' };
      case 'accepted': return { text: '#16a34a', bg: '#dcfce7' };
      case 'rejected': return { text: '#dc2626', bg: '#fee2e2' };
      default: return { text: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      default: return '📋';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Job History
          </Text>
          <Text style={styles.subtitle}>
            View all your quotes and completed jobs
          </Text>
        </View>

        {/* Filters and Sort */}
        <View style={styles.filtersSection}>
          {/* Status Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Filter by Status</Text>
            <View style={styles.filterButtons}>
              {(['all', 'pending', 'accepted', 'rejected'] as FilterStatus[]).map((status) => (
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
              {(['date', 'amount', 'status'] as SortBy[]).map((sort) => (
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
                    {sort === 'date' ? 'Date' : sort === 'amount' ? 'Amount' : 'Status'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Results Count */}
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>
            Showing {sortedQuotes.length} of {quotes.length} quotes
          </Text>
        </View>

        {/* Quotes List */}
        {sortedQuotes.length === 0 ? (
          <View style={styles.noQuotesContainer}>
            <Text style={styles.noQuotesText}>
              No quotes found with the current filters
            </Text>
          </View>
        ) : (
          sortedQuotes.map((quote) => (
            <View key={quote.id} style={styles.quoteCard}>
              {/* Header */}
              <View style={styles.quoteHeader}>
                <View style={styles.quoteHeaderLeft}>
                  <Text style={styles.quoteAmount}>
                    ${quote.amount} - {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                  </Text>
                  <Text style={styles.quoteDate}>
                    Submitted on {new Date(quote.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quote.status).bg }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(quote.status).text }]}>
                    {getStatusIcon(quote.status)} {quote.status}
                  </Text>
                </View>
              </View>

              {/* Service Request Info */}
              <View style={styles.serviceRequestInfo}>
                <Text style={styles.serviceRequestTitle}>
                  📋 Service Request Details
                </Text>
                <Text style={styles.serviceRequestDetail}>
                  Trade: {quote.serviceRequestId ? 'Unknown' : 'Unknown'} {/* TODO: Get actual trade type */}
                </Text>
                <Text style={styles.serviceRequestDetail}>
                  Suburb: {quote.serviceRequestId ? 'Unknown' : 'Unknown'} {/* TODO: Get actual suburb */}
                </Text>
              </View>

              {/* Quote Details */}
              <View style={styles.quoteDetails}>
                <Text style={styles.quoteNotes} numberOfLines={3}>
                  {quote.notes}
                </Text>
                
                <View style={styles.quoteBreakdown}>
                  <View style={styles.quoteBreakdownItem}>
                    <Text style={styles.quoteBreakdownLabel}>Materials</Text>
                    <Text style={styles.quoteBreakdownValue}>${quote.breakdown.materials}</Text>
                  </View>
                  <View style={styles.quoteBreakdownItem}>
                    <Text style={styles.quoteBreakdownLabel}>Labour</Text>
                    <Text style={styles.quoteBreakdownValue}>${quote.breakdown.labour}</Text>
                  </View>
                </View>
              </View>

              {/* Timeline */}
              <View style={styles.timeline}>
                <Text style={styles.timelineTitle}>📅 Timeline</Text>
                <View style={styles.timelineItems}>
                  <Text style={styles.timelineItem}>
                    🚀 Start: {new Date(quote.estimatedStartDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.timelineItem}>
                    ✅ Completion: {new Date(quote.estimatedCompletionDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  title="View Details"
                  onPress={() => handleViewDetails(quote)}
                  variant="outline"
                  size="small"
                />
                
                <Button
                  title="View Service Request"
                  onPress={() => handleViewServiceRequest(quote)}
                  variant="outline"
                  size="small"
                />
                
                <Button
                  title="Chat"
                  onPress={() => handleChatWithCustomer(quote)}
                  variant="outline"
                  size="small"
                />
              </View>
            </View>
          ))
        )}

        {/* Summary Stats */}
        {quotes.length > 0 && (
          <View style={styles.summaryStats}>
            <Text style={styles.summaryStatsTitle}>
              Summary
            </Text>
            <View style={styles.summaryStatsItems}>
              <View style={styles.summaryStatsItem}>
                <Text style={styles.summaryStatsLabel}>Total Quotes</Text>
                <Text style={styles.summaryStatsValue}>{quotes.length}</Text>
              </View>
              <View style={styles.summaryStatsItem}>
                <Text style={styles.summaryStatsLabel}>Pending</Text>
                <Text style={styles.summaryStatsValue}>
                  {quotes.filter(q => q.status === 'pending').length}
                </Text>
              </View>
              <View style={styles.summaryStatsItem}>
                <Text style={styles.summaryStatsLabel}>Accepted</Text>
                <Text style={styles.summaryStatsValue}>
                  {quotes.filter(q => q.status === 'accepted').length}
                </Text>
              </View>
              <View style={styles.summaryStatsItem}>
                <Text style={styles.summaryStatsLabel}>Rejected</Text>
                <Text style={styles.summaryStatsValue}>
                  {quotes.filter(q => q.status === 'rejected').length}
                </Text>
              </View>
              <View style={styles.summaryStatsItem}>
                <Text style={styles.summaryStatsLabel}>Total Value</Text>
                <Text style={styles.summaryStatsValue}>
                  ${quotes.reduce((sum, q) => sum + q.amount, 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Performance Tips */}
        <View style={styles.performanceTips}>
          <Text style={styles.performanceTipsTitle}>
            💡 Performance Tips
          </Text>
          <Text style={styles.performanceTipsText}>
            • Respond quickly to increase acceptance rate{'\n'}
            • Provide detailed quotes with clear timelines{'\n'}
            • Maintain good communication with customers{'\n'}
            • Complete jobs on time to build reputation
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // Tailwind gray-50
  },
  content: {
    padding: 16, // Tailwind p-6
  },
  header: {
    marginBottom: 16, // Tailwind mb-6
  },
  title: {
    fontSize: 24, // Tailwind text-2xl
    fontWeight: 'bold',
    color: '#1f2937', // Tailwind gray-900
  },
  subtitle: {
    fontSize: 16, // Tailwind text-gray-600
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
    color: '#4b5563', // Tailwind gray-700
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingVertical: 8, // Tailwind py-2
    paddingHorizontal: 12, // Tailwind px-3
    borderRadius: 999, // Tailwind rounded-full
    borderWidth: 1, // Tailwind border
    borderColor: '#d1d5db', // Tailwind border-gray-300
    backgroundColor: '#ffffff', // Tailwind bg-white
  },
  selectedFilterButton: {
    borderColor: '#3b82f6', // Tailwind border-primary-600
    backgroundColor: '#3b82f6', // Tailwind bg-primary-600
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
    marginBottom: 12, // Tailwind mb-4
  },
  resultsCountText: {
    fontSize: 14, // Tailwind text-gray-600
    color: '#6b7280',
  },
  noQuotesContainer: {
    backgroundColor: '#ffffff', // Tailwind bg-white
    borderRadius: 12, // Tailwind rounded-lg
    padding: 24, // Tailwind p-8
    borderWidth: 1, // Tailwind border
    borderColor: '#e5e7eb', // Tailwind border-gray-200
  },
  noQuotesText: {
    fontSize: 18, // Tailwind text-gray-500
    color: '#9ca3af',
    textAlign: 'center',
  },
  quoteCard: {
    backgroundColor: '#ffffff', // Tailwind bg-white
    borderRadius: 12, // Tailwind rounded-lg
    padding: 16, // Tailwind p-4
    borderWidth: 1, // Tailwind border
    borderColor: '#e5e7eb', // Tailwind border-gray-200
    marginBottom: 12, // Tailwind mb-4
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12, // Tailwind mb-3
  },
  quoteHeaderLeft: {
    flex: 1,
  },
  quoteAmount: {
    fontSize: 20, // Tailwind text-lg
    fontWeight: 'semibold',
    color: '#1f2937', // Tailwind gray-900
    marginBottom: 4,
  },
  quoteDate: {
    fontSize: 14, // Tailwind text-gray-600
    color: '#6b7280',
  },
  statusBadge: {
    paddingVertical: 6, // Tailwind py-2
    paddingHorizontal: 12, // Tailwind px-3
    borderRadius: 999, // Tailwind rounded-full
  },
  statusBadgeText: {
    fontSize: 14, // Tailwind text-sm
    fontWeight: 'medium',
    textTransform: 'capitalize',
  },
  serviceRequestInfo: {
    backgroundColor: '#f9fafb', // Tailwind bg-gray-50
    borderRadius: 12, // Tailwind rounded-lg
    padding: 12, // Tailwind p-3
    marginBottom: 12, // Tailwind mb-3
  },
  serviceRequestTitle: {
    fontSize: 14, // Tailwind text-sm
    fontWeight: 'medium',
    color: '#4b5563', // Tailwind gray-700
    marginBottom: 8,
  },
  serviceRequestDetail: {
    fontSize: 14, // Tailwind text-gray-600
    color: '#6b7280',
    marginBottom: 4,
  },
  quoteDetails: {
    marginBottom: 12, // Tailwind mb-3
  },
  quoteNotes: {
    fontSize: 16, // Tailwind text-gray-700
    color: '#4b5563',
    marginBottom: 8,
  },
  quoteBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quoteBreakdownItem: {
    flex: 1,
  },
  quoteBreakdownLabel: {
    fontSize: 14, // Tailwind text-sm
    color: '#6b7280',
    marginBottom: 4,
  },
  quoteBreakdownValue: {
    fontSize: 16, // Tailwind font-semibold
    color: '#1f2937', // Tailwind gray-900
  },
  timeline: {
    backgroundColor: '#e0f2fe', // Tailwind bg-blue-50
    borderRadius: 12, // Tailwind rounded-lg
    padding: 12, // Tailwind p-3
    borderWidth: 1, // Tailwind border
    borderColor: '#d1d5db', // Tailwind border-blue-200
  },
  timelineTitle: {
    fontSize: 16, // Tailwind text-blue-800
    fontWeight: 'medium',
    color: '#3b82f6', // Tailwind text-blue-800
    marginBottom: 8,
  },
  timelineItems: {
    flexDirection: 'column',
  },
  timelineItem: {
    fontSize: 14, // Tailwind text-blue-700
    color: '#3b82f6',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStats: {
    backgroundColor: '#ffffff', // Tailwind bg-white
    borderRadius: 12, // Tailwind rounded-lg
    padding: 16, // Tailwind p-4
    borderWidth: 1, // Tailwind border
    borderColor: '#e5e7eb', // Tailwind border-gray-200
    marginTop: 16, // Tailwind mt-6
  },
  summaryStatsTitle: {
    fontSize: 18, // Tailwind text-lg
    fontWeight: 'semibold',
    color: '#1f2937', // Tailwind gray-900
    marginBottom: 12, // Tailwind mb-3
  },
  summaryStatsItems: {
    flexDirection: 'column',
    gap: 8,
  },
  summaryStatsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatsLabel: {
    fontSize: 14, // Tailwind text-gray-600
    color: '#6b7280',
  },
  summaryStatsValue: {
    fontSize: 14, // Tailwind font-semibold
    fontWeight: 'semibold',
  },
  performanceTips: {
    backgroundColor: '#d1fae5', // Tailwind bg-green-50
    borderRadius: 12, // Tailwind rounded-lg
    padding: 16, // Tailwind p-4
    borderWidth: 1, // Tailwind border
    borderColor: '#d1fae5', // Tailwind border-green-200
    marginTop: 16, // Tailwind mt-6
  },
  performanceTipsTitle: {
    fontSize: 16, // Tailwind text-green-800
    fontWeight: 'semibold',
    color: '#06b6d4', // Tailwind text-green-800
    marginBottom: 8,
  },
  performanceTipsText: {
    fontSize: 14, // Tailwind text-green-700
    color: '#06b6d4',
    lineHeight: 20,
  },
});
