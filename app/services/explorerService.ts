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
  
  return {
    requestId,
    opportunityScore: Math.min(100, Math.max(20, 
      (priceSpread > 200 ? 30 : 0) + 
      (aggregation.totalQuotes < 5 ? 40 : 20) + 
      (Math.random() * 30 + 20)
    )),
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
  lastDoc: DocumentSnapshot | null = null
): Promise<{ requests: EnrichedServiceRequest[]; hasMore: boolean; lastDoc: DocumentSnapshot | null }> {
  secureLog('🔍 Fetching service requests:', { 
    filters: { dataFilters, intelligenceFilters }, 
    sortBy, 
    limitCount, 
    hasLastDoc: !!lastDoc,
    lastDocId: lastDoc?.id || 'none'
  });
  
  try {
    // Build query for service requests
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
    
    const requests = requestsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
      };
    });

    // Get request IDs for batch intelligence fetch
    const requestIds = requests.map(r => r.id);
    
    // Batch fetch pre-computed intelligence (handle empty array and 30+ limit)
    let intelligenceSnapshot: any;
    if (requestIds.length === 0) {
      intelligenceSnapshot = { docs: [] };
    } else if (requestIds.length <= 30) {
      const intelligenceQuery = query(
        collection(db, 'requestIntelligence'),
        where('requestId', 'in', requestIds)
      );
      intelligenceSnapshot = await getDocs(intelligenceQuery);
    } else {
      // Handle more than 30 items by chunking
      const chunks = [];
      for (let i = 0; i < requestIds.length; i += 30) {
        chunks.push(requestIds.slice(i, i + 30));
      }
      
      const allDocs: any[] = [];
      for (const chunk of chunks) {
        const chunkQuery = query(
          collection(db, 'requestIntelligence'),
          where('requestId', 'in', chunk)
        );
        const chunkSnapshot = await getDocs(chunkQuery);
        allDocs.push(...chunkSnapshot.docs);
      }
      intelligenceSnapshot = { docs: allDocs };
    }
    
    const intelligenceMap = new Map();
    intelligenceSnapshot.docs.forEach(doc => {
      const data = doc.data();
      intelligenceMap.set(data.requestId, {
        totalQuotes: data.totalQuotes,
        priceRange: {
          min: Math.round(data.priceRange.min * 100) / 100,
          max: Math.round(data.priceRange.max * 100) / 100,
          average: Math.round(data.priceRange.average * 100) / 100
        },
        timelineRange: {
          minDays: data.timelineRange.minDays,
          maxDays: data.timelineRange.maxDays,
          averageDays: Math.round(data.timelineRange.averageDays * 10) / 10
        },
        breakdown: {
          materials: {
            min: Math.round(data.breakdown.materials.min * 100) / 100,
            max: Math.round(data.breakdown.materials.max * 100) / 100,
            average: Math.round(data.breakdown.materials.average * 100) / 100
          },
          labor: {
            min: Math.round(data.breakdown.labor.min * 100) / 100,
            max: Math.round(data.breakdown.labor.max * 100) / 100,
            average: Math.round(data.breakdown.labor.average * 100) / 100
          }
        },
        competitionLevel: data.competitionLevel,
        opportunityScore: Math.round(data.opportunityScore * 100) / 100,
        competitivePosition: data.competitivePosition,
        recommendedPriceRange: {
          min: Math.round(data.recommendedPriceRange.min * 100) / 100,
          max: Math.round(data.recommendedPriceRange.max * 100) / 100,
          optimal: Math.round(data.recommendedPriceRange.optimal * 100) / 100
        },
        winProbability: Math.round(data.winProbability * 100) / 100,
        marketTrends: data.marketTrends,
        lastQuoteAt: data.lastQuoteAt?.toDate ? data.lastQuoteAt.toDate() : new Date()
      });
    });

    secureLog(`💰 Found intelligence for ${intelligenceMap.size}/${requests.length} requests`);

    // Build enriched requests
    const enrichedRequests: EnrichedServiceRequest[] = [];

    for (const request of requests) {
      const intelligence = intelligenceMap.get(request.id);
      
      if (!intelligence) {
        // Fallback for requests without intelligence
        const fallbackIntelligence = {
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
        
        enrichedRequests.push({
          ...request,
          quotes: fallbackIntelligence,
          intelligence: fallbackIntelligence,
          isUnlocked: false,
          distance: Math.round(Math.random() * 20 * 10) / 10
        });
        continue;
      }

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
          distance: Math.round(Math.random() * 20 * 10) / 10
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