import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  suburbKeyOf,
  tradeKeyOf,
  competitionFromAvgQuotes,
  demandFromRequests,
} from './types';

const db = admin.firestore();

const PERIOD = 'all';

interface RollupDelta {
  requestCount?: number;
  activeRequestCount?: number;
  completedCount?: number;
  quoteCount?: number;
  unlockCount?: number;
  totalQuotedValue?: number;
  acceptedValue?: number;
}

interface Scope {
  suburb?: string;
  postcode?: string;
  state?: string;
  trades: string[];
}

/**
 * Apply a delta to all relevant rollup docs for a request's scope:
 *  - one suburbTradeStats doc per trade
 *  - one suburbStats doc (suburb across trades)
 *  - one tradeStats doc per trade (trade across suburbs)
 *
 * Counters use FieldValue.increment for concurrency safety; derived fields
 * (averages, levels) are recomputed in a follow-up read+write so reads never
 * need to compute. We keep it simple and correct over micro-optimized.
 */
export async function applyRollupDelta(scope: Scope, delta: RollupDelta): Promise<void> {
  const sKey = suburbKeyOf(scope.suburb, scope.postcode);
  const suburbDisplay = scope.suburb || scope.postcode || 'Unknown';
  const trades = (scope.trades && scope.trades.length > 0 ? scope.trades : ['unknown']);

  const incFields = buildIncrement(delta);

  const targets: { ref: FirebaseFirestore.DocumentReference; base: Record<string, any> }[] = [];

  // suburbStats (across all trades)
  targets.push({
    ref: db.collection('suburbStats').doc(`${sKey}__${PERIOD}`),
    base: {
      suburbKey: sKey,
      suburb: suburbDisplay,
      postcode: scope.postcode || '',
      state: scope.state || '',
      period: PERIOD,
    },
  });

  for (const trade of trades) {
    const tKey = tradeKeyOf(trade);

    // suburbTradeStats (suburb x trade)
    targets.push({
      ref: db.collection('suburbTradeStats').doc(`${sKey}__${tKey}__${PERIOD}`),
      base: {
        suburbKey: sKey,
        suburb: suburbDisplay,
        postcode: scope.postcode || '',
        state: scope.state || '',
        tradeKey: tKey,
        trade,
        period: PERIOD,
      },
    });

    // tradeStats (trade across all suburbs)
    targets.push({
      ref: db.collection('tradeStats').doc(`${tKey}__${PERIOD}`),
      base: {
        tradeKey: tKey,
        trade,
        period: PERIOD,
      },
    });
  }

  // 1. Increment counters (create doc with set+merge defaults first if missing).
  await Promise.all(
    targets.map(async ({ ref, base }) => {
      await ref.set(
        { ...base, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      if (Object.keys(incFields).length > 0) {
        await ref.update(incFields);
      }
    })
  );

  // 2. Recompute derived fields from the freshly incremented counters.
  await Promise.all(targets.map(({ ref }) => recomputeDerived(ref)));
}

function buildIncrement(delta: RollupDelta): Record<string, any> {
  const inc: Record<string, any> = {};
  const map: [keyof RollupDelta, string][] = [
    ['requestCount', 'requestCount'],
    ['activeRequestCount', 'activeRequestCount'],
    ['completedCount', 'completedCount'],
    ['quoteCount', 'quoteCount'],
    ['unlockCount', 'unlockCount'],
    ['totalQuotedValue', 'totalQuotedValue'],
    ['acceptedValue', 'acceptedValue'],
  ];
  for (const [k, field] of map) {
    const v = delta[k];
    if (typeof v === 'number' && v !== 0) {
      inc[field] = FieldValue.increment(v);
    }
  }
  return inc;
}

async function recomputeDerived(ref: FirebaseFirestore.DocumentReference): Promise<void> {
  const snap = await ref.get();
  if (!snap.exists) return;
  const d = snap.data() as any;

  const requestCount = d.requestCount || 0;
  const quoteCount = d.quoteCount || 0;
  const unlockCount = d.unlockCount || 0;
  const totalQuotedValue = d.totalQuotedValue || 0;
  const acceptedValue = d.acceptedValue || 0;
  const completedCount = d.completedCount || 0;

  const avgQuoteValue = quoteCount > 0 ? Math.round(totalQuotedValue / quoteCount) : 0;
  const avgAcceptedValue = completedCount > 0 ? Math.round(acceptedValue / completedCount) : 0;
  const avgQuotesPerRequest = requestCount > 0 ? Math.round((quoteCount / requestCount) * 10) / 10 : 0;

  await ref.update({
    avgQuoteValue,
    avgAcceptedValue,
    avgQuotesPerRequest,
    competitionLevel: competitionFromAvgQuotes(avgQuotesPerRequest),
    demandLevel: demandFromRequests(requestCount, unlockCount),
    lastActivityAt: FieldValue.serverTimestamp(),
  });
}
