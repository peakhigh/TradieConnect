import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { VStack, HStack, Text, Button, Input } from '@gluestack-ui/themed';
import { Search, MapPin, Briefcase, DollarSign, Clock, Star } from 'lucide-react-native';
import { Container } from '../../components/UI/Container';
import { RequestCard } from '../../components/UI/RequestCard';
import { FilterTags } from '../../components/UI/FilterTags';
import { ResultsHeader } from '../../components/UI/ResultsHeader';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ServiceRequest } from '../../types/ServiceRequest';
import { ProjectLoader } from '../../components/UI/ProjectLoader';

export default function ServiceRequestExplorer() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedSuburb, setSelectedSuburb] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(10.00); // Mock wallet balance
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    // Set default filters based on user interests
    if (user?.interestedTrades?.length && !selectedTrade) {
      setSelectedTrade(user.interestedTrades[0]);
    }
    if (user?.interestedSuburbs?.length && !selectedSuburb) {
      setSelectedSuburb(user.interestedSuburbs[0]);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [selectedTrade, selectedSuburb, sortBy, dateFrom, dateTo, statusFilter]);

  const fetchRequests = async (loadMore = false) => {
    try {
      setLoading(!loadMore);
      
      let q = query(
        collection(db, 'serviceRequests'),
        where('status', '==', 'open'),
        orderBy(sortBy === 'newest' ? 'createdAt' : 'createdAt', sortBy === 'newest' ? 'desc' : 'asc'),
        limit(10)
      );

      if (selectedTrade) {
        q = query(q, where('trades', 'array-contains', selectedTrade));
      }

      if (selectedSuburb) {
        q = query(q, where('suburb', '==', selectedSuburb));
      }

      if (dateFrom) {
        q = query(q, where('createdAt', '>=', dateFrom));
      }

      if (dateTo) {
        q = query(q, where('createdAt', '<=', dateTo));
      }

      if (loadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const newRequests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceRequest[];

      if (loadMore) {
        setRequests(prev => [...prev, ...newRequests]);
      } else {
        setRequests(newRequests);
        setTotalResults(newRequests.length); // Mock total, in real app would need separate count query
      }

      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === 10);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchRequests(true);
    }
  };

  const handleUnlock = async (requestId: string) => {
    if (walletBalance < 0.50) {
      // Handle insufficient funds
      return;
    }
    
    try {
      // Mock unlock logic
      setWalletBalance(prev => prev - 0.50);
      console.log('Unlocked request:', requestId);
    } catch (error) {
      console.error('Error unlocking request:', error);
    }
  };

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <VStack space="lg" className="p-4">
          {/* Header Stats */}
          <VStack space="md">
            <Text className="text-2xl font-bold text-gray-900">Job Explorer</Text>
            <HStack space="md" className="justify-between">
              <VStack className="items-center bg-blue-50 p-3 rounded-lg flex-1">
                <Briefcase size={20} color="#3b82f6" />
                <Text className="text-sm text-gray-600">Available Jobs</Text>
                <Text className="text-lg font-bold text-blue-600">{totalResults}</Text>
              </VStack>
              <VStack className="items-center bg-green-50 p-3 rounded-lg flex-1">
                <DollarSign size={20} color="#10b981" />
                <Text className="text-sm text-gray-600">Wallet Balance</Text>
                <Text className="text-lg font-bold text-green-600">${walletBalance.toFixed(2)}</Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Search Bar */}
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-white"
          />

          {/* Filter Tags */}
          <FilterTags
            dateFrom={dateFrom}
            dateTo={dateTo}
            statusFilter={statusFilter}
            sortBy={sortBy}
            selectedTrade={selectedTrade}
            selectedSuburb={selectedSuburb}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onStatusChange={setStatusFilter}
            onSortChange={setSortBy}
            onTradeChange={setSelectedTrade}
            onSuburbChange={setSelectedSuburb}
            onClearAll={() => {
              setDateFrom(null);
              setDateTo(null);
              setStatusFilter('');
              setSortBy('newest');
              setSelectedTrade('');
              setSelectedSuburb('');
            }}
            availableTrades={[
              'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Roofing', 'Flooring',
              'HVAC', 'Landscaping', 'Tiling', 'Plastering', 'Handyman', 'Cleaning',
              ...(user?.interestedTrades || [])
            ]}
            availableSuburbs={[
              'Sydney CBD', 'Bondi', 'Manly', 'Parramatta', 'Chatswood', 'Hornsby',
              'Liverpool', 'Bankstown', 'Blacktown', 'Penrith', 'Campbelltown', 'Sutherland',
              ...(user?.interestedSuburbs || [])
            ]}
            showTradeFilter={true}
            showSuburbFilter={true}
          />

          {/* Results Header */}
          <ResultsHeader
            currentPage={currentPage}
            totalResults={totalResults}
            resultsPerPage={10}
            onPageChange={setCurrentPage}
          />

          {/* Results */}
          <VStack space="md">
            {loading ? (
              <ProjectLoader message="Loading jobs..." />
            ) : requests.length === 0 ? (
              <VStack className="items-center py-8">
                <Briefcase size={48} color="#9ca3af" />
                <Text className="text-gray-500 text-center mt-4">
                  No jobs found matching your criteria
                </Text>
              </VStack>
            ) : (
              requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onUnlock={() => handleUnlock(request.id)}
                  showUnlockButton={true}
                  unlockCost={0.50}
                />
              ))
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </Container>
  );
}