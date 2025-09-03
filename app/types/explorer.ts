// Service Request Types
export interface ServiceRequest {
  id: string;
  customerId: string;
  trades: string[];
  suburb: string;
  postcode: string;
  description: string;
  photos: string[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'quoted' | 'assigned' | 'completed';
  createdAt: Date;
  budget?: {
    min?: number;
    max?: number;
  };
}

// Quote Aggregation Data
export interface QuoteAggregation {
  requestId: string;
  totalQuotes: number;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  timelineRange: {
    minDays: number;
    maxDays: number;
    averageDays: number;
  };
  breakdown: {
    materials: { min: number; max: number; average: number };
    labor: { min: number; max: number; average: number };
  };
  competitionLevel: 'low' | 'medium' | 'high';
  lastQuoteAt: Date;
}

// Individual Quote
export interface Quote {
  id: string;
  requestId: string;
  tradieId: string;
  totalPrice: number;
  materialsCost: number;
  laborCost: number;
  timelineDays: number;
  proposedStartDate: Date;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// Tradie Performance Data
export interface TradiePerformance {
  tradieId: string;
  winRate: {
    overall: number;
    byTrade: Record<string, number>;
    bySuburb: Record<string, number>;
  };
  averageQuoteAccuracy: number;
  responseTime: number; // hours
  customerRating: number;
  completedJobs: number;
}

// Market Intelligence
export interface MarketIntelligence {
  requestId: string;
  opportunityScore: number; // 0-100
  competitivePosition: 'strong' | 'moderate' | 'weak';
  recommendedPriceRange: {
    min: number;
    max: number;
    optimal: number;
  };
  winProbability: number; // 0-1
  marketTrends: {
    priceDirection: 'up' | 'down' | 'stable';
    demandLevel: 'low' | 'medium' | 'high';
  };
}

// Filter Types
export interface DataFilters {
  trades: string[];
  location: {
    postcode: string;
    radius: number; // km
  };
  budget: {
    min: number;
    max: number;
  };
  urgency: ('low' | 'medium' | 'high' | 'urgent')[];
  postedWithin: number; // hours
}

export interface IntelligenceFilters {
  competitionLevel: 'all' | 'low' | 'medium' | 'high';
  winRateThreshold: number; // minimum win rate %
  opportunityScore: {
    min: number; // 0-100
    max: number;
  };
  priceGap: 'all' | 'large' | 'medium' | 'small'; // spread between min/max quotes
}

// Combined Request with Intelligence
export interface EnrichedServiceRequest extends ServiceRequest {
  quotes: QuoteAggregation;
  intelligence: MarketIntelligence;
  isUnlocked: boolean;
  distance?: number; // km from tradie
}

// Sort Options
export type SortOption = 
  | 'newest' 
  | 'closest' 
  | 'budget' 
  | 'opportunity' 
  | 'competition' 
  | 'winRate';

// API Response Types
export interface ExplorerResponse {
  requests: EnrichedServiceRequest[];
  totalCount: number;
  hasMore: boolean;
  filters: {
    availableTrades: string[];
    priceRange: { min: number; max: number };
    locationSuggestions: string[];
  };
}