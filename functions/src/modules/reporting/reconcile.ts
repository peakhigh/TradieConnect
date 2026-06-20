import { onSchedule } from 'firebase-functions/v2/scheduler';
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

interface Acc {
  suburb?: string;
  postcode?: string;
  state?: string;
  trade?: string;
  requestCount: number;
  activeRequestCount: number;
  completedCount: number;
  quoteCount: number;
  unlockCount: number;
  totalQuotedValue: number;
  acceptedValue: number;
}

const newAcc = (): Acc => ({
  requestCount: 0,
  activeRequestCount: 0,
  completedCount: 0,
  quoteCount: 0,
  unlockCount: 0,
  totalQuotedValue: 0,
  acceptedValue: 0,
});

/**
 * Nightly reconciliation: recompute all reporting rollups from source data
 * (serviceRequests + quotes). This corrects any drift from missed triggers and
 * is the authoritative recomputation. Runs at 03:00 daily.
 *
 * Marketplace-size note: this scans serviceRequests + quotes once. For very
 * large datasets this should be sharded/paginated, but it is correct and simple
 * for current scale.
 */
export const reconcileReportingRollups = onSchedule(
  { schedule: '0 3 * * *', timeZone: 'Australia/Sydney' },
  async () => {
    const suburbTrade: Record<string, Acc> = {};
    const suburb: Record<string, Acc> = {};
    const trade: Record<string, Acc> = {};

    const ensure = (map: Record<string, Acc>, key: string, seed: Partial<Acc>): Acc => {
      if (!map[key]) map[key] = { ...newAcc(), ...seed };
      return map[key];
    };

    // 1. Walk service requests.
    const requestsSnap = await db.collection('serviceRequests').get();
    const requestScope: Record<string, { sKey: string; trades: string[] }> = {};

    requestsSnap.forEach((doc) => {
      const d = doc.data() as any;
      const sKey = suburbKeyOf(d.suburb, d.postcode);
      const trades: string[] = (d.trades && d.trades.length ? d.trades : ['unknown']);
      requestScope[doc.id] = { sKey, trades };

      const isActive = d.status === 'new' || d.status === 'quoted';
      const isCompleted = d.status === 'completed';

      const sAcc = ensure(suburb, sKey, { suburb: d.suburb || d.postcode || 'Unknown', postcode: d.postcode, state: d.state });
      sAcc.requestCount += 1;
      if (isActive) sAcc.activeRequestCount += 1;
      if (isCompleted) sAcc.completedCount += 1;

      for (const t of trades) {
        const tKey = tradeKeyOf(t);
        const stAcc = ensure(suburbTrade, `${sKey}__${tKey}`, {
          suburb: d.suburb || d.postcode || 'Unknown', postcode: d.postcode, state: d.state, trade: t,
        });
        stAcc.requestCount += 1;
        if (isActive) stAcc.activeRequestCount += 1;
        if (isCompleted) stAcc.completedCount += 1;

        const tAcc = ensure(trade, tKey, { trade: t });
        tAcc.requestCount += 1;
        if (isActive) tAcc.activeRequestCount += 1;
        if (isCompleted) tAcc.completedCount += 1;
      }
    });

    // 2. Walk quotes, attributing to their request's scope.
    const quotesSnap = await db.collection('quotes').get();
    quotesSnap.forEach((doc) => {
      const q = doc.data() as any;
      const scope = requestScope[q.serviceRequestId];
      if (!scope) return;
      const { sKey, trades } = scope;

      const isUnlock = true; // every quote doc represents at least an unlock
      const isQuoted = q.status === 'quoted' || q.status === 'accepted' || q.status === 'rejected';
      const isAccepted = q.status === 'accepted';
      const price = q.totalPrice || 0;

      const sAcc = ensure(suburb, sKey, {});
      if (isUnlock) sAcc.unlockCount += 1;
      if (isQuoted) { sAcc.quoteCount += 1; sAcc.totalQuotedValue += price; }
      if (isAccepted) sAcc.acceptedValue += price;

      for (const t of trades) {
        const tKey = tradeKeyOf(t);
        const stAcc = ensure(suburbTrade, `${sKey}__${tKey}`, {});
        if (isUnlock) stAcc.unlockCount += 1;
        if (isQuoted) { stAcc.quoteCount += 1; stAcc.totalQuotedValue += price; }
        if (isAccepted) stAcc.acceptedValue += price;

        const tAcc = ensure(trade, tKey, {});
        if (isUnlock) tAcc.unlockCount += 1;
        if (isQuoted) { tAcc.quoteCount += 1; tAcc.totalQuotedValue += price; }
        if (isAccepted) tAcc.acceptedValue += price;
      }
    });

    // 3. Write everything back (batched).
    let batch = db.batch();
    let ops = 0;
    const commitIfNeeded = async () => {
      ops += 1;
      if (ops % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    };

    const derive = (a: Acc) => {
      const avgQuoteValue = a.quoteCount > 0 ? Math.round(a.totalQuotedValue / a.quoteCount) : 0;
      const avgAcceptedValue = a.completedCount > 0 ? Math.round(a.acceptedValue / a.completedCount) : 0;
      const avgQuotesPerRequest = a.requestCount > 0 ? Math.round((a.quoteCount / a.requestCount) * 10) / 10 : 0;
      return {
        avgQuoteValue,
        avgAcceptedValue,
        avgQuotesPerRequest,
        competitionLevel: competitionFromAvgQuotes(avgQuotesPerRequest),
        demandLevel: demandFromRequests(a.requestCount, a.unlockCount),
      };
    };

    for (const [key, a] of Object.entries(suburbTrade)) {
      const [sKey, tKey] = key.split('__');
      batch.set(db.collection('suburbTradeStats').doc(`${sKey}__${tKey}__${PERIOD}`), {
        suburbKey: sKey, suburb: a.suburb, postcode: a.postcode || '', state: a.state || '',
        tradeKey: tKey, trade: a.trade, period: PERIOD,
        requestCount: a.requestCount, activeRequestCount: a.activeRequestCount, completedCount: a.completedCount,
        quoteCount: a.quoteCount, unlockCount: a.unlockCount,
        totalQuotedValue: a.totalQuotedValue, acceptedValue: a.acceptedValue,
        ...derive(a), updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await commitIfNeeded();
    }

    for (const [sKey, a] of Object.entries(suburb)) {
      batch.set(db.collection('suburbStats').doc(`${sKey}__${PERIOD}`), {
        suburbKey: sKey, suburb: a.suburb, postcode: a.postcode || '', state: a.state || '', period: PERIOD,
        requestCount: a.requestCount, activeRequestCount: a.activeRequestCount, completedCount: a.completedCount,
        quoteCount: a.quoteCount, unlockCount: a.unlockCount,
        totalQuotedValue: a.totalQuotedValue, acceptedValue: a.acceptedValue,
        ...derive(a), updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await commitIfNeeded();
    }

    for (const [tKey, a] of Object.entries(trade)) {
      batch.set(db.collection('tradeStats').doc(`${tKey}__${PERIOD}`), {
        tradeKey: tKey, trade: a.trade, period: PERIOD,
        requestCount: a.requestCount, activeRequestCount: a.activeRequestCount, completedCount: a.completedCount,
        quoteCount: a.quoteCount, unlockCount: a.unlockCount,
        totalQuotedValue: a.totalQuotedValue, acceptedValue: a.acceptedValue,
        ...derive(a), updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await commitIfNeeded();
    }

    await batch.commit();
    console.log(`Reconciled rollups: ${Object.keys(suburbTrade).length} suburbTrade, ${Object.keys(suburb).length} suburb, ${Object.keys(trade).length} trade docs.`);
  }
);
