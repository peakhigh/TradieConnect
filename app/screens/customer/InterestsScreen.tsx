import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type TabParamList = {
  Dashboard: undefined;
  PostRequest: undefined;
  History: undefined;
  Profile: undefined;
};
import { Filter, MessageCircle, Star, MapPin, ArrowLeft } from 'lucide-react-native';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { RequestCard } from '../../components/UI/RequestCard';
import { RequestDetailsDrawer } from '../../components/UI/RequestDetailsDrawer';

interface Interest {
  id: string;
  requestId: string;
  tradieId: string;
  tradie: {
    firstName: string;
    lastName: string;
    rating: number;
    businessName: string;
  };
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export default function InterestsScreen() {
  const route = useRoute();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { requestId } = route.params as { requestId: string };
  const [interests, setInterests] = useState<Interest[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [request, setRequest] = useState<any>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const requestDoc = await getDoc(doc(db, 'serviceRequests', requestId));
        if (requestDoc.exists()) {
          setRequest({
            id: requestDoc.id,
            ...requestDoc.data(),
            createdAt: requestDoc.data().createdAt?.toDate() || new Date(),
          });
        }
      } catch (error) {
        console.error('Error fetching request:', error);
      }
    };

    const interestsQuery = query(
      collection(db, 'interests'),
      where('requestId', '==', requestId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(interestsQuery, (snapshot) => {
      const interestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Interest[];
      setInterests(interestsData);
    });

    fetchRequest();
    return unsubscribe;
  }, [requestId]);

  const filteredInterests = interests.filter(interest => 
    filter === 'all' || (filter === 'unread' && !interest.isRead)
  );

  const handleMessageTradie = (tradieId: string) => {
    navigation.navigate('Messages', { tradieId, requestId });
  };

  return (
    <Container style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={theme.colors.text.secondary} />
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
        
        <View style={styles.cardContainer}>
          {request && (
            <RequestCard 
              request={request} 
              showButtons={false}
              onViewDetails={() => setShowRequestDetails(true)}
            />
          )}
        </View>
        
        <Text style={styles.title}>Interests ({interests.length})</Text>
        
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All ({interests.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unread' && styles.activeFilter]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
              Unread ({interests.filter(i => !i.isRead).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        {filteredInterests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No interests yet</Text>
          </View>
        ) : (
          filteredInterests.map((interest) => (
            <View key={interest.id} style={styles.interestCard}>
              <View style={styles.tradieInfo}>
                <Text style={styles.tradieName}>
                  {interest.tradie.firstName} {interest.tradie.lastName}
                </Text>
                <Text style={styles.businessName}>{interest.tradie.businessName}</Text>
                <View style={styles.rating}>
                  <Star size={14} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.ratingText}>{interest.tradie.rating}</Text>
                </View>
              </View>
              
              <Text style={styles.message}>{interest.message}</Text>
              
              <View style={styles.cardFooter}>
                <Text style={styles.timestamp}>
                  {interest.createdAt.toLocaleDateString()}
                </Text>
                
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => handleMessageTradie(interest.tradieId)}
                >
                  <MessageCircle size={16} color={theme.colors.primary} />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
              
              {!interest.isRead && <View style={styles.unreadBadge} />}
            </View>
          ))
        )}
      </ScrollView>
      
      <RequestDetailsDrawer
        visible={showRequestDetails}
        onClose={() => setShowRequestDetails(false)}
        request={request}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  activeFilter: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#6b7280',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#6b7280',
  },
  interestCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  tradieInfo: {
    marginBottom: 12,
  },
  tradieName: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  businessName: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#6b7280',
  },
  message: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: theme.colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: Platform.OS === 'web' ? 12 : 10,
    color: '#9ca3af',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  messageButtonText: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  cardContainer: {
    paddingHorizontal: 20,
  },
});