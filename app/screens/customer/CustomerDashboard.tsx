import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { Sparkles, MessageCircle, Plus } from 'lucide-react-native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function CustomerDashboard() {
  const { user, successMessage, clearSuccessMessage } = useAuth();
  const { serviceRequests, quotes, unreadMessageCount } = useUser();

  useEffect(() => {
    if (successMessage) {
      Alert.alert('Success', successMessage);
      clearSuccessMessage();
    }
  }, [successMessage, clearSuccessMessage]);

  const activeRequests = serviceRequests.filter(req => req.status === 'active');
  const completedRequests = serviceRequests.filter(req => req.status === 'completed');

  const handleViewInterests = (requestId: string) => {
    Alert.alert('Info', 'View interests functionality coming soon');
  };

  const handleChatWithTradie = (tradieId: string) => {
    Alert.alert('Info', 'Chat functionality coming soon');
  };

  const handleAcceptQuote = (quoteId: string) => {
    Alert.alert('Info', 'Quote acceptance functionality coming soon');
  };

  const handleViewMessages = () => {
    Alert.alert('Info', 'Messages functionality coming soon');
  };

  const navigation = useNavigation();

  const handlePostRequest = () => {
    navigation.navigate('PostRequest' as never);
  };

  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                <Sparkles size={24} color={theme.colors.primary} /> Welcome back, {user?.firstName}!
              </Text>
              <Text style={styles.subtitle}>
                Here's what's happening with your service requests
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity onPress={handlePostRequest} style={styles.linkButton}>
            <Plus size={20} color={theme.colors.primary} />
            <Text style={styles.linkButtonText}>New Service Request</Text>
          </TouchableOpacity>
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
                  <TouchableOpacity 
                    onPress={() => handleViewInterests(request.id)}
                    style={styles.cardLinkButton}
                  >
                    <Text style={styles.cardLinkButtonText}>Interests</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleViewMessages}
                    style={styles.cardLinkButton}
                  >
                    <Text style={styles.cardLinkButtonText}>Messages</Text>
                  </TouchableOpacity>
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
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xxl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  title: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.xxl : theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.md : theme.fontSize.sm,
    color: theme.colors.text.secondary,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  quickActions: {
    marginBottom: theme.spacing.xxl,
    alignItems: 'flex-end',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  linkButtonText: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.lg : theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
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
    fontSize: Platform.OS === 'web' ? 20 : 18,
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
    flexWrap: 'wrap',
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
    fontSize: Platform.OS === 'web' ? theme.fontSize.lg : theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  requestDescription: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.md : theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  requestMeta: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.sm : theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
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
    gap: theme.spacing.md,
  },
  cardLinkButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  cardLinkButtonText: {
    color: theme.colors.primary,
    fontSize: Platform.OS === 'web' ? theme.fontSize.sm : theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    textDecorationLine: 'underline',
  },
});