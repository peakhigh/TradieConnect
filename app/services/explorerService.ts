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
  addDoc,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { EnrichedServiceRequest, DataFilters, IntelligenceFilters, QuoteAggregation, MarketIntelligence } from '../types/explorer';
import { secureLog, secureError } from '../utils/logger';

// Calculate distance between two points using Haversine formula
function calculateDistance(
  request: any, 
  tradieLocation?: { lat: number; lng: number }
): number {
  if (!tradieLocation || !request.location?.lat || !request.location?.lng) {
    return Math.round(Math.random() * 20 * 10) / 10; // Fallback to random
  }
  
  const R = 6371; // Earth's radius in km
  const dLat = (request.location.lat - tradieLocation.lat) * Math.PI / 180;
  const dLng = (request.location.lng - tradieLocation.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(tradieLocation.lat * Math.PI / 180) * Math.cos(request.location.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

// Calculate quote aggregation from quotes array
function calculateQuoteAggregation(quotes: any[]): QuoteAggregation {
  if (quotes.length === 0) {
    return {
      requestId: '',
      totalQuotes: 0,
      priceRange: { min: 0, max: 0, average: 0 },
      timelineRange: { minDays: 0, maxDays: 0, averageDays: 0 },
      breakdown: {
        materials: { min: 0, max: 0, average: 0 },
        labor: { min: 0, max: 0, average: 0 }
      },
      competitionLevel: 'low',
      lastQuoteAt: new Date()
    };
  }

  const prices = quotes.map(q => q.totalPrice);
  const timelines = quotes.map(q => q.timelineDays);
  const materials = quotes.map(q => q.materialsCost);
  const labor = quotes.map(q => q.laborCost);

  return {
    requestId: quotes[0].requestId,
    totalQuotes: quotes.length,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    },
    timelineRange: {
      minDays: Math.min(...timelines),
      maxDays: Math.max(...timelines),
      averageDays: Math.round(timelines.reduce((a, b) => a + b, 0) / timelines.length * 10) / 10
    },
    breakdown: {
      materials: {
        min: Math.min(...materials),
        max: Math.max(...materials),
        average: Math.round(materials.reduce((a, b) => a + b, 0) / materials.length)
      },
      labor: {
        min: Math.min(...labor),
        max: Math.max(...labor),
        average: Math.round(labor.reduce((a, b) => a + b, 0) / labor.length)
      }
    },
    competitionLevel: quotes.length < 3 ? 'low' : quotes.length < 7 ? 'medium' : 'high',
    lastQuoteAt: new Date(Math.max(...quotes.map(q => q.createdAt?.toDate ? q.createdAt.toDate().getTime() : new Date(q.createdAt).getTime())))
  };
}

// Calculate market intelligence
function calculateMarketIntelligence(requestId: string, quotes: any[]): MarketIntelligence {
  const aggregation = calculateQuoteAggregation(quotes);
  const priceSpread = aggregation.priceRange.max - aggregation.priceRange.min;
  const avgPrice = aggregation.priceRange.average;
  
  // Calculate opportunity score based on market conditions
  let opportunityScore = 50; // Base score
  
  // Competition factor (40% weight)
  if (aggregation.totalQuotes === 0) opportunityScore += 40;
  else if (aggregation.totalQuotes < 3) opportunityScore += 30;
  else if (aggregation.totalQuotes < 5) opportunityScore += 20;
  else if (aggregation.totalQuotes < 8) opportunityScore += 10;
  else opportunityScore -= 10; // High competition
  
  // Price spread factor (30% weight)
  const spreadPercentage = avgPrice > 0 ? (priceSpread / avgPrice) * 100 : 0;
  if (spreadPercentage > 50) opportunityScore += 30; // High price variance = opportunity
  else if (spreadPercentage > 25) opportunityScore += 20;
  else if (spreadPercentage > 10) opportunityScore += 10;
  
  // Budget factor (20% weight) - higher budgets = better opportunity
  if (avgPrice > 2000) opportunityScore += 20;
  else if (avgPrice > 1000) opportunityScore += 15;
  else if (avgPrice > 500) opportunityScore += 10;
  
  // Time factor (10% weight) - newer requests = better opportunity
  const hoursOld = (Date.now() - new Date(requestId).getTime()) / (1000 * 60 * 60);
  if (hoursOld < 2) opportunityScore += 10;
  else if (hoursOld < 6) opportunityScore += 5;
  else if (hoursOld > 24) opportunityScore -= 5;
  
  return {
    requestId,
    opportunityScore: Math.min(100, Math.max(10, Math.round(opportunityScore))),
    competitivePosition: aggregation.totalQuotes < 3 ? 'strong' : 
                       aggregation.totalQuotes < 7 ? 'moderate' : 'weak',
    recommendedPriceRange: {
      min: Math.round(aggregation.priceRange.average * 0.9),
      max: Math.round(aggregation.priceRange.average * 1.1),
      optimal: Math.round(aggregation.priceRange.average * 0.95)
    },
    winProbability: Math.max(0.2, Math.min(0.9, 
      (aggregation.totalQuotes < 3 ? 0.8 : 
       aggregation.totalQuotes < 7 ? 0.6 : 0.4) + 
      (Math.random() * 0.2 - 0.1)
    )),
    marketTrends: {
      priceDirection: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
      demandLevel: aggregation.totalQuotes > 7 ? 'high' : 
                   aggregation.totalQuotes > 3 ? 'medium' : 'low'
    }
  };
}

export async function fetchServiceRequests(
  dataFilters: DataFilters,
  intelligenceFilters: IntelligenceFilters,
  sortBy: string = 'newest',
  limitCount: number = 10,
  lastDoc: DocumentSnapshot | null = null,
  tradieLocation?: { lat: number; lng: number }
): Promise<{ requests: EnrichedServiceRequest[]; hasMore: boolean; lastDoc: DocumentSnapshot | null }> {
  secureLog('🔍 Fetching service requests:', { 
    filters: { dataFilters, intelligenceFilters }, 
    sortBy, 
    limitCount, 
    hasLastDoc: !!lastDoc,
    lastDocId: lastDoc?.id || 'none'
  });
  
  try {
    // Build query for service requests (now with embedded intelligence)
    let q = query(collection(db, 'serviceRequests'));

    // Apply sorting only
    q = query(q, orderBy('createdAt', 'desc'));

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(limitCount));

    const requestsSnapshot = await getDocs(q);
    secureLog(`📊 Firestore query returned ${requestsSnapshot.docs.length} documents (limit: ${limitCount})`);
    
    if (requestsSnapshot.docs.length > 0) {
      secureLog(`📄 First doc ID: ${requestsSnapshot.docs[0].id}, Last doc ID: ${requestsSnapshot.docs[requestsSnapshot.docs.length - 1].id}`);
    }
    
    // Build enriched requests directly from serviceRequests collection
    const enrichedRequests: EnrichedServiceRequest[] = [];

    for (const doc of requestsSnapshot.docs) {
      const data = doc.data();
      const request = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
      };

      // Extract intelligence data (now embedded in the same document)
      const intelligence = data.intelligence || {
        totalQuotes: 0,
        priceRange: { min: 0, max: 0, average: 0 },
        timelineRange: { minDays: 0, maxDays: 0, averageDays: 0 },
        breakdown: {
          materials: { min: 0, max: 0, average: 0 },
          labor: { min: 0, max: 0, average: 0 }
        },
        competitionLevel: 'low' as const,
        opportunityScore: 80,
        competitivePosition: 'strong' as const,
        recommendedPriceRange: { min: 0, max: 0, optimal: 0 },
        winProbability: 0.8,
        marketTrends: { priceDirection: 'stable' as const, demandLevel: 'low' as const },
        lastQuoteAt: new Date()
      };

      // Apply intelligence filters
      let includeRequest = true;
      let filterReasons = [];

      if (intelligenceFilters.competitionLevel !== 'all' && 
          intelligence.competitionLevel !== intelligenceFilters.competitionLevel) {
        includeRequest = false;
        filterReasons.push(`competition: ${intelligence.competitionLevel} != ${intelligenceFilters.competitionLevel}`);
      }

      if (intelligence.opportunityScore < intelligenceFilters.opportunityScore.min ||
          intelligence.opportunityScore > intelligenceFilters.opportunityScore.max) {
        includeRequest = false;
        filterReasons.push(`opportunity: ${intelligence.opportunityScore} not in [${intelligenceFilters.opportunityScore.min}, ${intelligenceFilters.opportunityScore.max}]`);
      }

      if (includeRequest) {
        enrichedRequests.push({
          ...request,
          quotes: intelligence,
          intelligence,
          isUnlocked: false,
          distance: calculateDistance(request, tradieLocation)
        });
      } else {
        secureLog(`❌ Filtered out request ${request.id}: ${filterReasons.join(', ')}`);
      }
    }

    // Apply additional sorting for intelligence-based sorts
    if (sortBy === 'opportunity') {
      enrichedRequests.sort((a, b) => b.intelligence.opportunityScore - a.intelligence.opportunityScore);
    } else if (sortBy === 'closest') {
      enrichedRequests.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (sortBy === 'budget') {
      enrichedRequests.sort((a, b) => {
        const budgetA = a.budget?.max || a.intelligence.recommendedPriceRange.max || 0;
        const budgetB = b.budget?.max || b.intelligence.recommendedPriceRange.max || 0;
        return budgetB - budgetA; // Highest first
      });
    }

    const hasMore = requestsSnapshot.docs.length === limitCount;
    const newLastDoc = requestsSnapshot.docs.length > 0 ? requestsSnapshot.docs[requestsSnapshot.docs.length - 1] : null;
    
    secureLog(`✅ Returning ${enrichedRequests.length} enriched requests`, {
      totalFetched: requestsSnapshot.docs.length,
      afterFiltering: enrichedRequests.length,
      hasMore,
      newLastDocId: newLastDoc?.id || 'none'
    });
    
    return {
      requests: enrichedRequests,
      hasMore,
      lastDoc: newLastDoc
    };

  } catch (error) {
    console.error('Full service error:', error);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    secureError('❌ Error fetching service requests:', error);
    return {
      requests: [],
      hasMore: false,
      lastDoc: null
    };
  }
}

export async function unlockServiceRequest(
  requestId: string, 
  tradieId: string
): Promise<EnrichedServiceRequest> {
  try {
    // Record unlock transaction
    await addDoc(collection(db, 'unlockTransactions'), {
      tradieId,
      requestId,
      amount: 0.50,
      type: 'unlock',
      status: 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Get the full request details
    const requestDoc = await getDoc(doc(db, 'serviceRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const requestData = {
      id: requestDoc.id,
      ...requestDoc.data(),
      createdAt: requestDoc.data()?.createdAt?.toDate() || new Date(),
      updatedAt: requestDoc.data()?.updatedAt?.toDate() || new Date()
    };

    // Get quotes
    const quotesQuery = query(
      collection(db, 'quotes'),
      where('requestId', '==', requestId)
    );
    const quotesSnapshot = await getDocs(quotesQuery);
    const quotes = quotesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));

    const quoteAggregation = calculateQuoteAggregation(quotes);
    const intelligence = calculateMarketIntelligence(requestId, quotes);

    return {
      ...requestData,
      quotes: quoteAggregation,
      intelligence,
      isUnlocked: true,
      distance: Math.random() * 20
    };

  } catch (error) {
    secureError('Error unlocking service request:', error);
    throw error;
  }
}

export async function checkUnlockedRequests(tradieId: string): Promise<string[]> {
  try {
    const unlocksQuery = query(
      collection(db, 'unlockTransactions'),
      where('tradieId', '==', tradieId),
      where('status', '==', 'completed')
    );
    
    const unlocksSnapshot = await getDocs(unlocksQuery);
    return unlocksSnapshot.docs.map(doc => doc.data().requestId);
  } catch (error) {
    secureError('Error checking unlocked requests:', error);
    return [];
  }
}