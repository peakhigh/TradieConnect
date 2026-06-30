#!/usr/bin/env node
/**
 * Backfill reporting rollups from seeded data + build a simple suburbAdjacency.
 *
 * The production `reconcileReportingRollups` Cloud Function does the same
 * authoritative recompute, but only on a nightly schedule. This script lets us
 * populate rollups on demand so the Insights screens render against seeded data.
 *
 * Mirrors functions/src/modules/reporting/{types,reconcile}.ts logic.
 *
 * Usage:
 *   node bin/data/backfillReporting.js
 * (run after bin/data/seed.js)
 */

require('dotenv').config();
const { db, collection, getDocs, doc, setDoc, Timestamp } = require('./fb');

const PERIOD = 'all';

// --- key + derive helpers (kept in sync with functions/.../reporting/types.ts) ---
const suburbKeyOf = (suburb, postcode) => {
  const s = (suburb || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const p = (postcode || '').trim().toLowerCase();
  if (s && p) return `${s}-${p}`;
  return s || p || 'unknown';
};
const tradeKeyOf = (t) => (t || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
const competitionFromAvgQuotes = (a) => (a < 3 ? 'low' : a < 7 ? 'medium' : 'high');
const demandFromRequests = (req, unlock) => {
  const i = req + unlock;
  return i > 40 ? 'high' : i > 12 ? 'medium' : 'low';
};

const newAcc = () => ({
  requestCount: 0, activeRequestCount: 0, completedCount: 0,
  quoteCount: 0, unlockCount: 0, totalQuotedValue: 0, acceptedValue: 0,
});
const derive = (a) => {
  const avgQuoteValue = a.quoteCount > 0 ? Math.round(a.totalQuotedValue / a.quoteCount) : 0;
  const avgAcceptedValue = a.completedCount > 0 ? Math.round(a.acceptedValue / a.completedCount) : 0;
  const avgQuotesPerRequest = a.requestCount > 0 ? Math.round((a.quoteCount / a.requestCount) * 10) / 10 : 0;
  return {
    avgQuoteValue, avgAcceptedValue, avgQuotesPerRequest,
    competitionLevel: competitionFromAvgQuotes(avgQuotesPerRequest),
    demandLevel: demandFromRequests(a.requestCount, a.unlockCount),
  };
};

async function backfill() {
  console.log('\n📊 Backfilling reporting rollups...');
  const suburbTrade = {};
  const suburb = {};
  const trade = {};
  const ensure = (map, key, seed) => { if (!map[key]) map[key] = { ...newAcc(), ...seed }; return map[key]; };

  // 1. Service requests.
  const requestScope = {};
  const reqSnap = await getDocs(collection(db, 'serviceRequests'));
  reqSnap.forEach((d) => {
    const r = d.data();
    const sKey = suburbKeyOf(r.suburb, r.postcode);
    const trades = (r.trades && r.trades.length ? r.trades : ['unknown']);
    requestScope[d.id] = { sKey, trades, suburb: r.suburb, postcode: r.postcode, state: r.state };

    const isActive = r.status === 'new' || r.status === 'quoted';
    const isCompleted = r.status === 'completed';
    const sAcc = ensure(suburb, sKey, { suburb: r.suburb || r.postcode || 'Unknown', postcode: r.postcode, state: r.state });
    sAcc.requestCount += 1;
    if (isActive) sAcc.activeRequestCount += 1;
    if (isCompleted) sAcc.completedCount += 1;

    for (const t of trades) {
      const tKey = tradeKeyOf(t);
      const st = ensure(suburbTrade, `${sKey}__${tKey}`, { suburb: r.suburb || r.postcode || 'Unknown', postcode: r.postcode, state: r.state, trade: t });
      st.requestCount += 1;
      if (isActive) st.activeRequestCount += 1;
      if (isCompleted) st.completedCount += 1;
      const ta = ensure(trade, tKey, { trade: t });
      ta.requestCount += 1;
      if (isActive) ta.activeRequestCount += 1;
      if (isCompleted) ta.completedCount += 1;
    }
  });

  // 2. Quotes.
  const quotesSnap = await getDocs(collection(db, 'quotes'));
  quotesSnap.forEach((d) => {
    const q = d.data();
    const scope = requestScope[q.serviceRequestId];
    if (!scope) return;
    const { sKey, trades } = scope;
    const isQuoted = q.status === 'quoted' || q.status === 'accepted' || q.status === 'rejected';
    const isAccepted = q.status === 'accepted';
    const price = q.totalPrice || 0;

    const sAcc = ensure(suburb, sKey, {});
    sAcc.unlockCount += 1;
    if (isQuoted) { sAcc.quoteCount += 1; sAcc.totalQuotedValue += price; }
    if (isAccepted) sAcc.acceptedValue += price;

    for (const t of trades) {
      const tKey = tradeKeyOf(t);
      const st = ensure(suburbTrade, `${sKey}__${tKey}`, {});
      st.unlockCount += 1;
      if (isQuoted) { st.quoteCount += 1; st.totalQuotedValue += price; }
      if (isAccepted) st.acceptedValue += price;
      const ta = ensure(trade, tKey, {});
      ta.unlockCount += 1;
      if (isQuoted) { ta.quoteCount += 1; ta.totalQuotedValue += price; }
      if (isAccepted) ta.acceptedValue += price;
    }
  });

  // 3. Write rollups (tagged mock:true so clean.js removes them).
  let written = 0;
  for (const [key, a] of Object.entries(suburbTrade)) {
    const [sKey, tKey] = key.split('__');
    await setDoc(doc(db, 'suburbTradeStats', `${sKey}__${tKey}__${PERIOD}`), {
      suburbKey: sKey, suburb: a.suburb, postcode: a.postcode || '', state: a.state || '',
      tradeKey: tKey, trade: a.trade, period: PERIOD,
      requestCount: a.requestCount, activeRequestCount: a.activeRequestCount, completedCount: a.completedCount,
      quoteCount: a.quoteCount, unlockCount: a.unlockCount,
      totalQuotedValue: a.totalQuotedValue, acceptedValue: a.acceptedValue,
      ...derive(a), mock: true, updatedAt: Timestamp.now(),
    }, { merge: true });
    written++;
  }
  for (const [sKey, a] of Object.entries(suburb)) {
    await setDoc(doc(db, 'suburbStats', `${sKey}__${PERIOD}`), {
      suburbKey: sKey, suburb: a.suburb, postcode: a.postcode || '', state: a.state || '', period: PERIOD,
      requestCount: a.requestCount, activeRequestCount: a.activeRequestCount, completedCount: a.completedCount,
      quoteCount: a.quoteCount, unlockCount: a.unlockCount,
      totalQuotedValue: a.totalQuotedValue, acceptedValue: a.acceptedValue,
      ...derive(a), mock: true, updatedAt: Timestamp.now(),
    }, { merge: true });
    written++;
  }
  for (const [tKey, a] of Object.entries(trade)) {
    await setDoc(doc(db, 'tradeStats', `${tKey}__${PERIOD}`), {
      tradeKey: tKey, trade: a.trade, period: PERIOD,
      requestCount: a.requestCount, activeRequestCount: a.activeRequestCount, completedCount: a.completedCount,
      quoteCount: a.quoteCount, unlockCount: a.unlockCount,
      totalQuotedValue: a.totalQuotedValue, acceptedValue: a.acceptedValue,
      ...derive(a), mock: true, updatedAt: Timestamp.now(),
    }, { merge: true });
    written++;
  }
  console.log(`  ✅ ${written} rollup docs (${Object.keys(suburbTrade).length} suburb×trade, ${Object.keys(suburb).length} suburb, ${Object.keys(trade).length} trade)`);

  // 4. Build a simple suburbAdjacency from the suburbs we saw (each is neighbor
  //    to all others; pseudo distances). Real data would use geo centroids.
  const suburbKeys = Object.entries(suburb).map(([sKey, a]) => ({ sKey, postcode: a.postcode || sKey, suburb: a.suburb }));
  let adj = 0;
  for (const home of suburbKeys) {
    const neighbors = suburbKeys
      .filter((n) => n.sKey !== home.sKey)
      .map((n, i) => ({ suburbKey: n.sKey, suburb: n.suburb, postcode: n.postcode, distanceKm: 3 + i * 2 }))
      .slice(0, 20);
    await setDoc(doc(db, 'suburbAdjacency', home.sKey), {
      suburbKey: home.sKey, suburb: home.suburb, postcode: home.postcode,
      neighbors, mock: true, updatedAt: Timestamp.now(),
    }, { merge: true });
    adj++;
  }
  console.log(`  ✅ ${adj} suburbAdjacency docs`);

  console.log('\n🎉 Reporting backfill complete.');
  process.exit(0);
}

backfill().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
