import { ServiceRequestStatus } from './serviceRequestStatus';

// The service request document as stored in Firestore (flat intel_* fields)
export interface ServiceRequestDoc {
  id: string;
  customerId: string;
  trades: string[];
  tradesLower: string[];
  description: string;
  descriptionLower: string;
  postcode: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: ServiceRequestStatus;
  photos: string[];
  documents: string[];
  voiceMessage: string | null;
  budgetMin: number;
  budgetMax: number;
  searchKeywords: string[];
  createdAt: Date;
  updatedAt: Date;

  // Intelligence fields (flat)
  intel_totalQuotes: number;
  intel_totalUnlocks: number;
  intel_priceMin: number;
  intel_priceMax: number;
  intel_priceAverage: number;
  intel_timelineMinDays: number;
  intel_timelineMaxDays: number;
  intel_timelineAvgDays: number;
  intel_materialsMin: number;
  intel_materialsMax: number;
  intel_materialsAvg: number;
  intel_laborMin: number;
  intel_laborMax: number;
  intel_laborAvg: number;
  intel_competitionLevel: 'low' | 'medium' | 'high';
  intel_opportunityScore: number;
  intel_competitivePosition: 'strong' | 'moderate' | 'weak';
  intel_recommendedPriceMin: number;
  intel_recommendedPriceMax: number;
  intel_recommendedPriceOptimal: number;
  intel_winProbability: number;
  intel_priceGap: number;
  intel_priceGapCategory: 'small' | 'medium' | 'large';
  intel_priceDirection: 'up' | 'down' | 'stable';
  intel_demandLevel: 'low' | 'medium' | 'high';
  intel_lastQuoteAt: Date | null;
  intel_updatedAt: Date;
}

// Extended with UI-only fields
export interface ExplorerRequest extends ServiceRequestDoc {
  isUnlocked: boolean;
  distance?: number;
}

// Filter Types
export interface DataFilters {
  trades: string[];
  location: { postcode: string; radius: number };
  budget: { min: number; max: number };
  urgency: ('low' | 'medium' | 'high' | 'urgent')[];
  postedWithin: number; // hours
}

export interface IntelligenceFilters {
  competitionLevel: 'all' | 'low' | 'medium' | 'high';
  winRateThreshold: number;
  opportunityScore: { min: number; max: number };
  priceGap: 'all' | 'large' | 'medium' | 'small';
}

// Sort Options
export type SortOption = 'newest' | 'closest' | 'budget' | 'opportunity';

// --- Deprecated aliases (for backward compat during migration) ---
/** @deprecated Use ExplorerRequest instead */
export type EnrichedServiceRequest = ExplorerRequest;

/** @deprecated Intelligence is now flat intel_* fields on ServiceRequestDoc */
export interface QuoteAggregation {
  requestId: string;
  totalQuotes: number;
  priceRange: { min: number; max: number; average: number };
  timelineRange: { minDays: number; maxDays: number; averageDays: number };
  breakdown: {
    materials: { min: number; max: number; average: number };
    labor: { min: number; max: number; average: number };
  };
  competitionLevel: 'low' | 'medium' | 'high';
  lastQuoteAt: Date;
}

/** @deprecated Intelligence is now flat intel_* fields on ServiceRequestDoc */
export interface MarketIntelligence {
  requestId: string;
  opportunityScore: number;
  competitivePosition: 'strong' | 'moderate' | 'weak';
  recommendedPriceRange: { min: number; max: number; optimal: number };
  winProbability: number;
  marketTrends: {
    priceDirection: 'up' | 'down' | 'stable';
    demandLevel: 'low' | 'medium' | 'high';
  };
}
