export type CompetitionLevel = 'low' | 'medium' | 'high';
export type DemandLevel = 'low' | 'medium' | 'high';

export interface SuburbTradeStat {
  id: string;
  suburbKey: string;
  suburb: string;
  postcode: string;
  state?: string;
  tradeKey: string;
  trade: string;
  period: string;
  requestCount: number;
  activeRequestCount: number;
  completedCount: number;
  quoteCount: number;
  unlockCount: number;
  totalQuotedValue: number;
  acceptedValue: number;
  avgQuoteValue: number;
  avgAcceptedValue: number;
  avgQuotesPerRequest: number;
  competitionLevel: CompetitionLevel;
  demandLevel: DemandLevel;
}

export interface SuburbStat extends Omit<SuburbTradeStat, 'tradeKey' | 'trade'> {}

export interface TradeStat {
  id: string;
  tradeKey: string;
  trade: string;
  period: string;
  requestCount: number;
  activeRequestCount: number;
  completedCount: number;
  quoteCount: number;
  unlockCount: number;
  totalQuotedValue: number;
  acceptedValue: number;
  avgQuoteValue: number;
  avgAcceptedValue: number;
  avgQuotesPerRequest: number;
  competitionLevel: CompetitionLevel;
  demandLevel: DemandLevel;
}

export interface NearbySuburbRow {
  suburbKey: string;
  suburb: string;
  postcode: string;
  distanceKm: number;
  stats: SuburbTradeStat | null;
}

export type RankSortBy = 'acceptedValue' | 'requestCount' | 'quoteCount' | 'avgQuoteValue';
