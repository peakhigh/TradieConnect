import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';

export default function TradieDashboard() {
  const { user } = useAuth();
  const { quotes, unreadMessageCount } = useUser();

  // Cast user to Tradie type since this is the TradieDashboard
  const tradieUser = user as any; // Type assertion for now

  const activeQuotes = quotes.filter(quote => quote.status === 'pending');
  const acceptedQuotes = quotes.filter(quote => quote.status === 'accepted');

  const handleViewRequests = () => {
    // TODO: Navigate to service request explorer
    Alert.alert('Info', 'Service request explorer coming soon');
  };

  const handleViewMessages = () => {
    // TODO: Navigate to messages
    Alert.alert('Info', 'Messages functionality coming soon');
  };

  const handleViewWallet = () => {
    // TODO: Navigate to wallet
    Alert.alert('Info', 'Wallet functionality coming soon');
  };

  const handleViewStats = () => {
    // TODO: Navigate to detailed stats
    Alert.alert('Info', 'Detailed stats coming soon');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome back, {tradieUser?.firstName}!
          </Text>
          <Text style={styles.subtitle}>
            Here's your business overview
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {activeQuotes.length}
              </Text>
              <Text style={styles.statLabel}>Active Quotes</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumberAccepted}>
                {acceptedQuotes.length}
              </Text>
              <Text style={styles.statLabel}>Accepted Jobs</Text>
            </View>
          </View>
        </View>

        {/* Messages Notification */}
        {unreadMessageCount > 0 && (
          <TouchableOpacity
            style={styles.messageNotification}
            onPress={handleViewMessages}
          >
            <Text style={styles.messageTitle}>
              You have {unreadMessageCount} new message{unreadMessageCount > 1 ? 's' : ''}
            </Text>
            <Text style={styles.messageSubtitle}>
              Tap to view messages
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Explore Service Requests"
            onPress={handleViewRequests}
            size="large"
          />
        </View>

        {/* Wallet Info */}
        <View style={styles.walletCard}>
          <Text style={styles.walletTitle}>
            Wallet Balance
          </Text>
          <Text style={styles.walletBalance}>
            ${tradieUser?.walletBalance || 0}
          </Text>
          <Text style={styles.walletDescription}>
            Available credits for unlocking requests
          </Text>
          
          <View style={styles.walletButtons}>
            <Button
              title="Recharge Wallet"
              onPress={handleViewWallet}
              variant="outline"
              size="small"
            />
            <Button
              title="View Transactions"
              onPress={handleViewWallet}
              variant="outline"
              size="small"
            />
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.performanceStats}>
          <Text style={styles.performanceTitle}>
            Performance Overview
          </Text>
          
          <View style={styles.performanceDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rating</Text>
              <Text style={styles.detailValue}>{tradieUser?.rating || 0}/5 ⭐</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Jobs</Text>
              <Text style={styles.detailValue}>{tradieUser?.totalJobs || 0}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Interested Suburbs</Text>
              <Text style={styles.detailValue}>{tradieUser?.interestedSuburbs?.length || 0}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Interested Trades</Text>
              <Text style={styles.detailValue}>{tradieUser?.interestedTrades?.length || 0}</Text>
            </View>
          </View>
          
          <Button
            title="View Detailed Stats"
            onPress={handleViewStats}
            variant="outline"
            size="small"
            style={styles.viewStatsButton}
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.activityTitle}>
            Recent Activity
          </Text>
          
          {quotes.length === 0 ? (
            <View style={styles.noActivityCard}>
              <Text style={styles.noActivityText}>
                No recent activity. Start exploring service requests!
              </Text>
            </View>
          ) : (
            quotes.slice(0, 3).map((quote) => (
              <View key={quote.id} style={styles.activityCard}>
                <Text style={styles.activityAmount}>
                  ${quote.amount} - {quote.status}
                </Text>
                <Text style={styles.activityNotes}>
                  {quote.notes}
                </Text>
                <Text style={styles.activityDate}>
                  Submitted on {quote.createdAt.toDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Quick Tips */}
        <View style={styles.quickTips}>
          <Text style={styles.tipTitle}>
            💡 Pro Tip
          </Text>
          <Text style={styles.tipText}>
            Unlock service requests strategically. Focus on requests in your preferred suburbs 
            and trades to maximize your success rate and earnings.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  quickStats: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4f46e5', // primary-600
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statNumberAccepted: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22c55e', // green-600
  },
  messageNotification: {
    backgroundColor: '#e0f7fa', // blue-50
    borderWidth: 1,
    borderColor: '#90caf9', // blue-200
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: '#4299e1', // blue-800
  },
  messageSubtitle: {
    fontSize: 14,
    color: '#60a5fa', // blue-600
    marginTop: 4,
  },
  quickActions: {
    marginBottom: 16,
  },
  walletCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: '#333',
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4f46e5', // primary-600
    marginBottom: 8,
  },
  walletDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  walletButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceStats: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: '#333',
    marginBottom: 12,
  },
  performanceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'semibold',
  },
  viewStatsButton: {
    marginTop: 16,
  },
  recentActivity: {
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: '#333',
    marginBottom: 12,
  },
  noActivityCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  noActivityText: {
    color: '#999',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: '#333',
    marginBottom: 4,
  },
  activityNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
  quickTips: {
    backgroundColor: '#e0f7fa', // blue-50
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#90caf9', // blue-200
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: '#4299e1', // blue-800
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#60a5fa', // blue-700
  },
});
