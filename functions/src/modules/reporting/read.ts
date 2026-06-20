import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { suburbKeyOf, tradeKeyOf } from './types';

const db = admin.firestore();
const PERIOD = 'all';

const requireAuth = (request: any) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  return request.auth.uid as string;
};

const mapDoc = (doc: FirebaseFirestore.DocumentSnapshot) => {
  const d = doc.data() as any;
  if (!d) return null;
  const { updatedAt, lastActivityAt, ...rest } = d;
  return { id: doc.id, ...rest };
};

/**
 * getMySuburbReport
 * Input: { suburbKeys?: string[], suburbs?: {suburb,postcode}[], tradeKeys: string[] }
 * Returns the suburbTradeStats rows for the tradie's (suburb x trade) pairs.
 */
export const getMySuburbReport = https.onCall(async (request) => {
  requireAuth(request);
  const { suburbs = [], tradeKeys = [] } = request.data || {};

  const sKeys: string[] = (suburbs as any[]).map((s) =>
    typeof s === 'string' ? s : suburbKeyOf(s.suburb, s.postcode)
  );
  const tKeys: string[] = (tradeKeys as string[]).map((t) => tradeKeyOf(t));

  const ids: string[] = [];
  for (const s of sKeys) {
    for (const t of tKeys) {
      ids.push(`${s}__${t}__${PERIOD}`);
    }
  }
  if (ids.length === 0) return { rows: [] };

  // Batch reads by document id (cheap, no index needed).
  const refs = ids.map((id) => db.collection('suburbTradeStats').doc(id));
  const snaps = await db.getAll(...refs);
  const rows = snaps.map(mapDoc).filter(Boolean);

  return { rows };
});

/**
 * getSuburbDetail
 * Input: { suburbKey? , suburb?, postcode? }
 * Returns the suburb total + per-trade breakdown.
 */
export const getSuburbDetail = https.onCall(async (request) => {
  requireAuth(request);
  const { suburbKey, suburb, postcode } = request.data || {};
  const sKey = suburbKey || suburbKeyOf(suburb, postcode);

  const totalSnap = await db.collection('suburbStats').doc(`${sKey}__${PERIOD}`).get();

  const perTradeSnap = await db.collection('suburbTradeStats')
    .where('suburbKey', '==', sKey)
    .where('period', '==', PERIOD)
    .orderBy('acceptedValue', 'desc')
    .limit(50)
    .get();

  return {
    total: mapDoc(totalSnap),
    trades: perTradeSnap.docs.map(mapDoc).filter(Boolean),
  };
});

/**
 * rankSuburbs
 * Input: { tradeKey, sortBy?: 'acceptedValue'|'requestCount'|'quoteCount', limit?: number }
 * Returns top suburbs for a given trade.
 */
export const rankSuburbs = https.onCall(async (request) => {
  requireAuth(request);
  const { tradeKey, trade, sortBy = 'acceptedValue', limit = 20 } = request.data || {};
  const tKey = tradeKey || tradeKeyOf(trade);
  const sortField = ['acceptedValue', 'requestCount', 'quoteCount', 'avgQuoteValue'].includes(sortBy)
    ? sortBy
    : 'acceptedValue';

  const snap = await db.collection('suburbTradeStats')
    .where('tradeKey', '==', tKey)
    .where('period', '==', PERIOD)
    .orderBy(sortField, 'desc')
    .limit(Math.min(limit, 50))
    .get();

  return { rows: snap.docs.map(mapDoc).filter(Boolean), sortBy: sortField };
});

/**
 * rankTrades
 * Input: { sortBy?, limit?, excludeTradeKeys?: string[] }
 * Returns trades ranked across all suburbs (for "learn a new trade").
 */
export const rankTrades = https.onCall(async (request) => {
  requireAuth(request);
  const { sortBy = 'requestCount', limit = 30, excludeTradeKeys = [] } = request.data || {};
  const sortField = ['acceptedValue', 'requestCount', 'quoteCount', 'avgQuoteValue'].includes(sortBy)
    ? sortBy
    : 'requestCount';

  const snap = await db.collection('tradeStats')
    .where('period', '==', PERIOD)
    .orderBy(sortField, 'desc')
    .limit(Math.min(limit, 60))
    .get();

  const exclude = new Set((excludeTradeKeys as string[]).map((t) => tradeKeyOf(t)));
  const rows = snap.docs.map(mapDoc).filter((r: any) => r && !exclude.has(r.tradeKey));

  return { rows, sortBy: sortField };
});

/**
 * getNearbySuburbReport
 * Input: { homeSuburbKey?, homeSuburb?, homePostcode?, tradeKey, limit? }
 * Uses the suburbAdjacency collection to find neighbors, then reads their
 * suburbTradeStats for the trade.
 */
export const getNearbySuburbReport = https.onCall(async (request) => {
  requireAuth(request);
  const { homeSuburbKey, homeSuburb, homePostcode, tradeKey, trade, limit = 10 } = request.data || {};
  const sKey = homeSuburbKey || suburbKeyOf(homeSuburb, homePostcode);
  const tKey = tradeKey || tradeKeyOf(trade);

  const adjSnap = await db.collection('suburbAdjacency').doc(sKey).get();
  if (!adjSnap.exists) return { rows: [], neighbors: [] };

  const neighbors: any[] = (adjSnap.data() as any).neighbors || [];
  const limited = neighbors.slice(0, Math.min(limit, 25));

  const refs = limited.map((n) =>
    db.collection('suburbTradeStats').doc(`${n.suburbKey}__${tKey}__${PERIOD}`)
  );
  if (refs.length === 0) return { rows: [], neighbors: limited };

  const snaps = await db.getAll(...refs);
  const statsByKey: Record<string, any> = {};
  snaps.map(mapDoc).forEach((r: any) => {
    if (r) statsByKey[r.suburbKey] = r;
  });

  // Merge distance info from adjacency with stats (may be null if no activity yet).
  const rows = limited.map((n) => ({
    suburbKey: n.suburbKey,
    suburb: n.suburb,
    postcode: n.postcode,
    distanceKm: n.distanceKm,
    stats: statsByKey[n.suburbKey] || null,
  }));

  return { rows, neighbors: limited };
});
