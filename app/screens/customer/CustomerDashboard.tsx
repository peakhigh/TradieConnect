import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { serviceRequests, quotes, unreadMessageCount } = useUser();

  const activeRequests = serviceRequests.filter(req => req.status === 'active');
  const completedRequests = serviceRequests.filter(req => req.status === 'completed');

  const handleViewInterests = (requestId: string) => {
    // TODO: Navigate to interests view
    Alert.alert('Info', 'View interests functionality coming soon');
  };

  const handleChatWithTradie = (tradieId: string) => {
    // TODO: Navigate to chat
    Alert.alert('Info', 'Chat functionality coming soon');
  };

  const handleAcceptQuote = (quoteId: string) => {
    // TODO: Navigate to quote acceptance
    Alert.alert('Info', 'Quote acceptance functionality coming soon');
  };

  const handleViewMessages = () => {
    // TODO: Navigate to messages
    Alert.alert('Info', 'Messages functionality coming soon');
  };

  const handlePostRequest = () => {
    // TODO: Navigate to post request
    Alert.alert('Info', 'Post request functionality coming soon');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome back, {user?.firstName}!
          </Text>
          <Text style={styles.subtitle}>
            Here's what's happening with your service requests
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Post New Service Request"
            onPress={handlePostRequest}
            size="large"
          />
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

        {/* Active Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Active Requests ({activeRequests.length})
          </Text>
          
          {activeRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No active requests. Post a new request to get started!
              </Text>
            </View>
          ) : (
            activeRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <Text style={styles.requestTitle}>
                  {request.tradeType}
                </Text>
                <Text style={styles.requestDescription}>
                  {request.description}
                </Text>
                <Text style={styles.requestMeta}>
                  Suburb: {request.suburb} • Urgency: {request.urgency}
                </Text>
                
                <View style={styles.buttonRow}>
                  <Button
                    title="View Interests"
                    onPress={() => handleViewInterests(request.id)}
                    variant="outline"
                    size="small"
                  />
                  <Button
                    title="View Messages"
                    onPress={handleViewMessages}
                    variant="outline"
                    size="small"
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Quotes */}
        {quotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Recent Quotes ({quotes.length})
            </Text>
            
            {quotes.slice(0, 3).map((quote) => (
              <View key={quote.id} style={styles.quoteCard}>
                <Text style={styles.quoteTitle}>
                  ${quote.amount} - {quote.tradie.firstName} {quote.tradie.lastName}
                </Text>
                <Text style={styles.quoteNotes}>
                  {quote.notes}
                </Text>
                <Text style={styles.quoteMeta}>
                  Start: {quote.estimatedStartDate.toDateString()} • 
                  Completion: {quote.estimatedCompletionDate.toDateString()}
                </Text>
                
                <View style={styles.buttonRow}>
                  <Button
                    title="Accept Quote"
                    onPress={() => handleAcceptQuote(quote.id)}
                    size="small"
                  />
                  <Button
                    title="Chat with Tradie"
                    onPress={() => handleChatWithTradie(quote.tradieId)}
                    variant="outline"
                    size="small"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Completed Requests */}
        {completedRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Completed Requests ({completedRequests.length})
            </Text>
            
            {completedRequests.slice(0, 3).map((request) => (
              <View key={request.id} style={styles.completedCard}>
                <Text style={styles.completedTitle}>
                  {request.tradeType}
                </Text>
                <Text style={styles.completedDescription}>
                  {request.description}
                </Text>
                <Text style={styles.completedMeta}>
                  Completed on {request.updatedAt.toDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  quickActions: {
    marginBottom: 24,
  },
  messageNotification: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  messageTitle: {
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageSubtitle: {
    color: '#2563eb',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  requestDescription: {
    color: '#6b7280',
    marginBottom: 8,
  },
  requestMeta: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  quoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  quoteNotes: {
    color: '#6b7280',
    marginBottom: 8,
  },
  quoteMeta: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  completedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  completedDescription: {
    color: '#6b7280',
    marginBottom: 8,
  },
  completedMeta: {
    fontSize: 14,
    color: '#9ca3af',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
