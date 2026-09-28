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
import { postcodeToLatLng, haversineKm, LatLng } from '../utils/geo';

/**
 * Real distance (km) from the tradie to a request.
 * Prefers exact geo stored on the request (request.geo.lat/lng), then falls
 * back to postcode-centroid distance. Returns undefined when we can't place
 * either point (so the UI can hide distance rather than show a fake number).
 */
function calculateDistance(
  request: any,
  tradieLatLng?: LatLng | null
): number | undefined {
  if (!tradieLatLng) return undefined;

  // Prefer exact geo if the request carries it.
  const requestLatLng: LatLng | null =
    request.geo?.lat != null && request.geo?.lng != null
      ? { lat: request.geo.lat, lng: request.geo.lng }
      : request.location?.lat != null && request.location?.lng != null
      ? { lat: request.location.lat, lng: request.location.lng }
      : postcodeToLatLng(request.postcode);

  if (!requestLatLng) return undefined;
  return haversineKm(tradieLatLng, requestLatLng);
}

/**
 * Tokenize a free-text search query into lowercase words (length >= 2).
 * Mirrors how searchKeywords/notesWords are generated on write.
 */
export function tokenizeSearch(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length >= 2);
}

/**
 * Does a request match the search terms? A request matches if EVERY search
 * term appears in its searchKeywords, tradesLower, description, or postcode.
 * (AND semantics — all terms must be present, so "leaking tap" narrows results.)
 */
function matchesSearch(req: ExplorerRequest, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = [
    ...(req.searchKeywords || []),
    ...(req.tradesLower || []),
    ...(req.trades || []).map((t) => t.toLowerCase()),
    (req.descriptionLower || req.description || '').toLowerCase(),
    req.postcode || '',
  ].join(' ');
  return terms.every((term) => haystack.includes(term));
}

export async function fetchServiceRequests(
  dataFilters: DataFilters,
  intelligenceFilters: IntelligenceFilters,
  sortBy: string = 'newest',
  limitCount: number = 15,
  lastDoc: DocumentSnapshot | null = null,
  tradiePostcode?: string | null,
  searchText: string = ''
): Promise<{ requests: ExplorerRequest[]; hasMore: boolean; lastDoc: DocumentSnapshot | null }> {
  // Resolve the tradie's location once (from their postcode) for distance calc.
  const tradieLatLng = postcodeToLatLng(tradiePostcode);
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
        distance: calculateDistance(data, tradieLatLng),
      } as ExplorerRequest;
    });

    // --- Text search (AND across all terms) ---
    const searchTerms = tokenizeSearch(searchText);
    if (searchTerms.length > 0) {
      requests = requests.filter(r => matchesSearch(r, searchTerms));
    }

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
      // Items with no resolvable distance sort to the end.
      requests.sort((a, b) => {
        const da = a.distance ?? Number.POSITIVE_INFINITY;
        const db_ = b.distance ?? Number.POSITIVE_INFINITY;
        return da - db_;
      });
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
