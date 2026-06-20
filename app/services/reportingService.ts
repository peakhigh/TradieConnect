import { runCloudFunction } from './cloudFunctions';
import {
  SuburbTradeStat,
  SuburbStat,
  TradeStat,
  NearbySuburbRow,
  RankSortBy,
} from '../types/reporting';

/** Tradie's own suburbs x trades performance grid. */
export async function getMySuburbReport(
  suburbs: { suburb?: string; postcode?: string }[],
  tradeKeys: string[]
): Promise<SuburbTradeStat[]> {
  const res = await runCloudFunction<{ rows: SuburbTradeStat[] }>('getMySuburbReport', {
    suburbs,
    tradeKeys,
  });
  return res.rows || [];
}

/** One suburb: total + per-trade breakdown. */
export async function getSuburbDetail(
  suburb: { suburbKey?: string; suburb?: string; postcode?: string }
): Promise<{ total: SuburbStat | null; trades: SuburbTradeStat[] }> {
  const res = await runCloudFunction<{ total: SuburbStat | null; trades: SuburbTradeStat[] }>(
    'getSuburbDetail',
    suburb
  );
  return { total: res.total || null, trades: res.trades || [] };
}

/** Rank suburbs for a trade by money / demand. */
export async function rankSuburbs(
  trade: string,
  sortBy: RankSortBy = 'acceptedValue',
  limit = 20
): Promise<SuburbTradeStat[]> {
  const res = await runCloudFunction<{ rows: SuburbTradeStat[] }>('rankSuburbs', {
    trade,
    sortBy,
    limit,
  });
  return res.rows || [];
}

/** Rank trades across all suburbs (optionally excluding ones the tradie already does). */
export async function rankTrades(
  sortBy: RankSortBy = 'requestCount',
  excludeTradeKeys: string[] = [],
  limit = 30
): Promise<TradeStat[]> {
  const res = await runCloudFunction<{ rows: TradeStat[] }>('rankTrades', {
    sortBy,
    excludeTradeKeys,
    limit,
  });
  return res.rows || [];
}

/** Nearby suburbs doing well in a trade. */
export async function getNearbySuburbReport(
  home: { suburb?: string; postcode?: string },
  trade: string,
  limit = 10
): Promise<NearbySuburbRow[]> {
  const res = await runCloudFunction<{ rows: NearbySuburbRow[] }>('getNearbySuburbReport', {
    homeSuburb: home.suburb,
    homePostcode: home.postcode,
    trade,
    limit,
  });
  return res.rows || [];
}
