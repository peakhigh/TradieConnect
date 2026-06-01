import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { ExplorerRequest, DataFilters, IntelligenceFilters } from '../types/explorer';
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
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(tradieLocation.lat * Math.PI / 180) * Math.cos(request.location.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function fetchServiceRequests(
  dataFilters: DataFilters,
  intelligenceFilters: IntelligenceFilters,
  sortBy: string = 'newest',
  limitCount: number = 15,
  lastDoc: DocumentSnapshot | null = null,
  tradieLocation?: { lat: number; lng: number }
): Promise<{ requests: ExplorerRequest[]; hasMore: boolean; lastDoc: DocumentSnapshot | null }> {
  secureLog('🔍 Fetching service requests:', {
    filters: { dataFilters, intelligenceFilters },
    sortBy,
    limitCount,
    hasLastDoc: !!lastDoc,
    lastDocId: lastDoc?.id || 'none'
  });

  try {
    // Primary Firestore query: status + orderBy + pagination
    let q = query(
      collection(db, 'serviceRequests'),
      where('status', '==', 'new'),
      orderBy('createdAt', 'desc')
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(limitCount));

    const snapshot = await getDocs(q);
    secureLog(`📊 Firestore query returned ${snapshot.docs.length} documents (limit: ${limitCount})`);

    if (snapshot.docs.length > 0) {
      secureLog(`📄 First doc ID: ${snapshot.docs[0].id}, Last doc ID: ${snapshot.docs[snapshot.docs.length - 1].id}`);
    }

    // Map documents to ExplorerRequest — read flat intel_* fields directly
    let requests: ExplorerRequest[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        customerId: data.customerId || '',
        trades: data.trades || [],
        tradesLower: data.tradesLower || [],
        description: data.description || '',
        descriptionLower: data.descriptionLower || '',
        postcode: data.postcode || '',
        urgency: data.urgency || 'low',
        status: data.status || 'new',
        photos: data.photos || [],
        documents: data.documents || [],
        voiceMessage: data.voiceMessage || null,
        budgetMin: data.budgetMin || 0,
        budgetMax: data.budgetMax || 0,
        searchKeywords: data.searchKeywords || [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),

        // Flat intelligence fields (with || 0 fallbacks for pre-migration docs)
        intel_totalQuotes: data.intel_totalQuotes || 0,
        intel_totalUnlocks: data.intel_totalUnlocks || 0,
        intel_priceMin: data.intel_priceMin || 0,
        intel_priceMax: data.intel_priceMax || 0,
        intel_priceAverage: data.intel_priceAverage || 0,
        intel_timelineMinDays: data.intel_timelineMinDays || 0,
        intel_timelineMaxDays: data.intel_timelineMaxDays || 0,
        intel_timelineAvgDays: data.intel_timelineAvgDays || 0,
        intel_materialsMin: data.intel_materialsMin || 0,
        intel_materialsMax: data.intel_materialsMax || 0,
        intel_materialsAvg: data.intel_materialsAvg || 0,
        intel_laborMin: data.intel_laborMin || 0,
        intel_laborMax: data.intel_laborMax || 0,
        intel_laborAvg: data.intel_laborAvg || 0,
        intel_competitionLevel: data.intel_competitionLevel || 'low',
        intel_opportunityScore: data.intel_opportunityScore || 0,
        intel_competitivePosition: data.intel_competitivePosition || 'strong',
        intel_recommendedPriceMin: data.intel_recommendedPriceMin || 0,
        intel_recommendedPriceMax: data.intel_recommendedPriceMax || 0,
        intel_recommendedPriceOptimal: data.intel_recommendedPriceOptimal || 0,
        intel_winProbability: data.intel_winProbability || 0,
        intel_priceGap: data.intel_priceGap || 0,
        intel_priceGapCategory: data.intel_priceGapCategory || 'small',
        intel_priceDirection: data.intel_priceDirection || 'stable',
        intel_demandLevel: data.intel_demandLevel || 'low',
        intel_lastQuoteAt: data.intel_lastQuoteAt?.toDate ? data.intel_lastQuoteAt.toDate() : null,
        intel_updatedAt: data.intel_updatedAt?.toDate ? data.intel_updatedAt.toDate() : new Date(),

        // UI-only fields
        isUnlocked: false,
        distance: calculateDistance(data, tradieLocation),
      } as ExplorerRequest;
    });

    // --- Client-side Data Filters ---
    if (dataFilters.trades.length > 0) {
      requests = requests.filter(r =>
        r.tradesLower?.some(t => dataFilters.trades.includes(t))
      );
    }
    if (dataFilters.urgency.length > 0) {
      requests = requests.filter(r => dataFilters.urgency.includes(r.urgency));
    }
    if (dataFilters.budget.min > 0 || dataFilters.budget.max < 5000) {
      requests = requests.filter(r => {
        const max = r.budgetMax || r.intel_priceAverage || 0;
        return max >= dataFilters.budget.min && max <= dataFilters.budget.max;
      });
    }
    if (dataFilters.location.postcode) {
      requests = requests.filter(r => r.postcode === dataFilters.location.postcode);
    }
    if (dataFilters.postedWithin < 24) {
      const cutoff = new Date(Date.now() - dataFilters.postedWithin * 60 * 60 * 1000);
      requests = requests.filter(r => r.createdAt >= cutoff);
    }

    // --- Client-side Intelligence Filters ---
    if (intelligenceFilters.competitionLevel !== 'all') {
      requests = requests.filter(r => r.intel_competitionLevel === intelligenceFilters.competitionLevel);
    }
    if (intelligenceFilters.opportunityScore.min > 0 || intelligenceFilters.opportunityScore.max < 100) {
      requests = requests.filter(r =>
        (r.intel_opportunityScore || 0) >= intelligenceFilters.opportunityScore.min &&
        (r.intel_opportunityScore || 0) <= intelligenceFilters.opportunityScore.max
      );
    }
    if (intelligenceFilters.winRateThreshold > 0) {
      requests = requests.filter(r =>
        ((r.intel_winProbability || 0) * 100) >= intelligenceFilters.winRateThreshold
      );
    }
    if (intelligenceFilters.priceGap !== 'all') {
      requests = requests.filter(r => r.intel_priceGapCategory === intelligenceFilters.priceGap);
    }

    // --- Client-side Sort ---
    if (sortBy === 'opportunity') {
      requests.sort((a, b) => (b.intel_opportunityScore || 0) - (a.intel_opportunityScore || 0));
    } else if (sortBy === 'closest') {
      requests.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (sortBy === 'budget') {
      requests.sort((a, b) => (b.budgetMax || b.intel_priceAverage || 0) - (a.budgetMax || a.intel_priceAverage || 0));
    }

    const hasMore = snapshot.docs.length === limitCount;
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    secureLog(`✅ Returning ${requests.length} requests`, {
      totalFetched: snapshot.docs.length,
      afterFiltering: requests.length,
      hasMore,
      newLastDocId: newLastDoc?.id || 'none'
    });

    return { requests, hasMore, lastDoc: newLastDoc };
  } catch (error: any) {
    console.error('Full service error:', error);
    secureError('❌ Error fetching service requests:', error);
    return { requests: [], hasMore: false, lastDoc: null };
  }
}

export async function checkUnlockedRequests(tradieId: string): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'quotes'),
      where('tradieId', '==', tradieId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().serviceRequestId);
  } catch (error) {
    secureError('Error checking unlocked requests:', error);
    return [];
  }
}
