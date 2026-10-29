#!/usr/bin/env node
/**
 * Backfill the denormalized fields that unlockServiceRequest now writes onto
 * quotes, for quotes created before it did:
 *   - customerId          (from the request) — customers query, and the rules
 *                          authorize, quotes by it. Run BEFORE deploying those rules.
 *   - trades / postcode / suburb (from the request) — tradie History/Dashboard labels
 *   - tradieName          (from the tradie profile) when it was saved as 'Unknown'
 *
 * Usage:
 *   node bin/data/backfillQuoteFields.js         # dry run (prints only)
 *   node bin/data/backfillQuoteFields.js --yes   # write
 *
 * Targets whatever bin/data/config.js points at (the emulator by default).
 */

require('dotenv').config();
const { db } = require('./fb');

const WRITE = process.argv.includes('--yes');

function displayName(user) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return user.businessName || full || user.displayName || user.name || '';
}

async function cached(cache, collection, id) {
  if (!id) return null;
  if (!cache.has(id)) {
    const snap = await db.collection(collection).doc(id).get();
    cache.set(id, snap.exists ? snap.data() : null);
  }
  return cache.get(id);
}

async function backfill() {
  const quotes = await db.collection('quotes').get();
  const requests = new Map();
  const users = new Map();
  const counts = { customerId: 0, location: 0, tradieName: 0 };
  let toUpdate = 0;
  let orphaned = 0;
  let batch = db.batch();
  let pending = 0;

  for (const q of quotes.docs) {
    const data = q.data();
    const update = {};

    const needsRequest = !data.customerId || !Array.isArray(data.trades);
    if (needsRequest) {
      const req = await cached(requests, 'serviceRequests', data.serviceRequestId);
      if (!req) {
        orphaned++;
        console.log(`  ⚠️  ${q.id}: request ${data.serviceRequestId || '(none)'} not found — skipped`);
        continue;
      }
      if (!data.customerId && req.customerId) {
        update.customerId = req.customerId;
        counts.customerId++;
      }
      if (!Array.isArray(data.trades)) {
        update.trades = req.trades || [];
        update.postcode = req.postcode || '';
        update.suburb = req.suburb || '';
        counts.location++;
      }
    }

    if (!data.tradieName || data.tradieName === 'Unknown') {
      const tradie = await cached(users, 'users', data.tradieId);
      const name = tradie ? displayName(tradie) : '';
      if (name) {
        update.tradieName = name;
        counts.tradieName++;
      }
    }

    if (Object.keys(update).length === 0) continue;
    toUpdate++;
    if (WRITE) {
      batch.update(q.ref, update);
      if (++pending === 400) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
  }
  if (WRITE && pending > 0) await batch.commit();

  console.log(`🔎 ${quotes.size} quotes checked`);
  console.log(`${WRITE ? '✅ Updated' : '📝 Would update'} ${toUpdate} quotes ` +
    `(customerId ${counts.customerId}, trades/postcode ${counts.location}, tradieName ${counts.tradieName}); ${orphaned} skipped.`);
  if (!WRITE) console.log('   Dry run — re-run with --yes to write.');
}

backfill().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
