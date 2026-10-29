#!/usr/bin/env node
/**
 * Backfill `customerId` onto quotes that don't have it, copied from the
 * parent serviceRequest. Customers query their quotes by customerId and the
 * Firestore rules authorize quote reads by it, so run this BEFORE deploying
 * those rules.
 *
 * Usage:
 *   node bin/data/backfillQuoteCustomerId.js         # dry run (prints only)
 *   node bin/data/backfillQuoteCustomerId.js --yes   # write
 *
 * Targets whatever bin/data/config.js points at (the emulator by default).
 */

require('dotenv').config();
const { db } = require('./fb');

const WRITE = process.argv.includes('--yes');

async function backfill() {
  const quotes = await db.collection('quotes').get();
  const missing = quotes.docs.filter((d) => !d.data().customerId);
  console.log(`🔎 ${quotes.size} quotes, ${missing.length} without customerId`);

  const requestCache = new Map();
  let updated = 0;
  let orphaned = 0;
  let batch = db.batch();
  let pending = 0;

  for (const q of missing) {
    const requestId = q.data().serviceRequestId;
    if (!requestCache.has(requestId)) {
      const req = requestId ? await db.collection('serviceRequests').doc(requestId).get() : null;
      requestCache.set(requestId, req && req.exists ? req.data().customerId || null : null);
    }
    const customerId = requestCache.get(requestId);
    if (!customerId) {
      orphaned++;
      console.log(`  ⚠️  ${q.id}: request ${requestId || '(none)'} missing or has no customerId — skipped`);
      continue;
    }
    if (WRITE) {
      batch.update(q.ref, { customerId });
      if (++pending === 400) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
    updated++;
  }
  if (WRITE && pending > 0) await batch.commit();

  console.log(`${WRITE ? '✅ Updated' : '📝 Would update'} ${updated} quotes; ${orphaned} skipped.`);
  if (!WRITE) console.log('   Dry run — re-run with --yes to write.');
}

backfill().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
