import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs, 
  doc, 
  getDoc,
  DocumentSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { EnrichedServiceRequest, DataFilters, IntelligenceFilters } from '../types/explorer';

export async function fetchServiceRequests(
  dataFilters: DataFilters,
  intelligenceFilters: IntelligenceFilters,
  sortBy: string = 'newest',
  limitCount: number = 10,
  lastDoc: DocumentSnapshot | null = null
): Promise<{ requests: EnrichedServiceRequest[]; hasMore: boolean; lastDoc: DocumentSnapshot | null }> {
  
  try {
    // 1. Query service requests (basic data only)
    let requestsQuery = query(collection(db, 'serviceRequests'));
    
    // Apply filters
    if (dataFilters.trades.length > 0) {
      requestsQuery = query(requestsQuery, where('trades', 'array-contains-any', dataFilters.trades));
    }
    if (dataFilters.urgency.length > 0) {
      requestsQuery = query(requestsQuery, where('urgency', 'in', dataFilters.urgency));
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        requestsQuery = query(requestsQuery, orderBy('createdAt', 'desc'));
        break;
      case 'budget':
        requestsQuery = query(requestsQuery, orderBy('budget.max', 'desc'));
        break;
      default:
        requestsQuery = query(requestsQuery, orderBy('createdAt', 'desc'));
    }
    
    // Pagination
    if (lastDoc) {
      requestsQuery = query(requestsQuery, startAfter(lastDoc));
    }
    requestsQuery = query(requestsQuery, limit(limitCount));
    
    const requestsSnapshot = await getDocs(requestsQuery);
    const requestIds = requestsSnapshot.docs.map(doc => doc.id);
    
    // 2. Batch fetch pre-computed intelligence (single query)
    const intelligenceQuery = query(
      collection(db, 'requestIntelligence'),
      where('requestId', 'in', requestIds)
    );
    const intelligenceSnapshot = await getDocs(intelligenceQuery);
    
    // Create intelligence lookup map
    const intelligenceMap = new Map();
    intelligenceSnapshot.docs.forEach(doc => {
      const data = doc.data();
      intelligenceMap.set(data.requestId, {
        quotes: data.quotes,
        intelligence: data.intelligence
      });
    });
    
    // 3. Combine data (no heavy calculations)
    const enrichedRequests: EnrichedServiceRequest[] = requestsSnapshot.docs
      .map(doc => {
        const requestData = { id: doc.id, ...doc.data() };
        const intelligence = intelligenceMap.get(doc.id);
        
        if (!intelligence) return null; // Skip if no intelligence data
        
        // Apply intelligence filters
        if (intelligenceFilters.competitionLevel !== 'all' && 
            intelligence.quotes.competitionLevel !== intelligenceFilters.competitionLevel) {
          return null;
        }
        
        if (intelligence.intelligence.opportunityScore < intelligenceFilters.opportunityScore.min ||
            intelligence.intelligence.opportunityScore > intelligenceFilters.opportunityScore.max) {
          return null;
        }
        
        return {
          ...requestData,
          quotes: intelligence.quotes,
          intelligence: intelligence.intelligence,
          isUnlocked: false,
          distance: Math.random() * 20,
          createdAt: requestData.createdAt?.toDate() || new Date()
        };
      })
      .filter(Boolean) as EnrichedServiceRequest[];
    
    // Apply intelligence-based sorting
    if (sortBy === 'opportunity') {
      enrichedRequests.sort((a, b) => b.intelligence.opportunityScore - a.intelligence.opportunityScore);
    }
    
    return {
      requests: enrichedRequests,
      hasMore: requestsSnapshot.docs.length === limitCount,
      lastDoc: requestsSnapshot.docs.length > 0 ? requestsSnapshot.docs[requestsSnapshot.docs.length - 1] : null
    };
    
  } catch (error) {
    console.error('Error fetching optimized requests:', error);
    return { requests: [], hasMore: false, lastDoc: null };
  }
}