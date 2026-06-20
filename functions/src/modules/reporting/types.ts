/**
 * Reporting rollup document shapes. These are pre-aggregated, deterministic-ID
 * documents updated on quote/request lifecycle changes so the app can read a
 * handful of small docs instead of scanning the marketplace.
 *
 * Doc IDs:
 *   suburbTradeStats/{suburbKey}__{tradeKey}__{period}
 *   suburbStats/{suburbKey}__{period}
 *   tradeStats/{tradeKey}__{period}
 *
 * period is always 'all' for now (monthly buckets can be added later).
 */

export type Period = 'all';

export interface RollupCounters {
  requestCount: number;
  activeRequestCount: number;
  completedCount: number;
  quoteCount: number;
  unlockCount: number;
  totalQuotedValue: number;
  acceptedValue: number;
  // derived (recomputed on each write from the counters above)
  avgQuoteValue: number;
  avgAcceptedValue: number;
  avgQuotesPerRequest: number;
  competitionLevel: 'low' | 'medium' | 'high';
  demandLevel: 'low' | 'medium' | 'high';
}

export const ZERO_COUNTERS: RollupCounters = {
  requestCount: 0,
  activeRequestCount: 0,
  completedCount: 0,
  quoteCount: 0,
  unlockCount: 0,
  totalQuotedValue: 0,
  acceptedValue: 0,
  avgQuoteValue: 0,
  avgAcceptedValue: 0,
  avgQuotesPerRequest: 0,
  competitionLevel: 'low',
  demandLevel: 'low',
};

/** Normalize a suburb/postcode into a stable key, e.g. "Bondi Beach" + "2026" -> "bondi-beach-2026". */
export function suburbKeyOf(suburb?: string, postcode?: string): string {
  const s = (suburb || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const p = (postcode || '').trim().toLowerCase();
  if (s && p) return `${s}-${p}`;
  return s || p || 'unknown';
}

export function tradeKeyOf(trade: string): string {
  return (trade || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

export function competitionFromAvgQuotes(avgQuotesPerRequest: number): 'low' | 'medium' | 'high' {
  if (avgQuotesPerRequest < 3) return 'low';
  if (avgQuotesPerRequest < 7) return 'medium';
  return 'high';
}

export function demandFromRequests(requestCount: number, unlockCount: number): 'low' | 'medium' | 'high' {
  const interest = requestCount + unlockCount;
  if (interest > 40) return 'high';
  if (interest > 12) return 'medium';
  return 'low';
}
