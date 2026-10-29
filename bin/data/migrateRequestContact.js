#!/usr/bin/env node
/**
 * Move customerAddress / customerPhone off public serviceRequests docs (which
 * every signed-in user can read) into serviceRequests/{id}/private/contact,
 * readable only by the customer and the accepted tradie. acceptQuote writes
 * the new shape; this fixes docs written before that change.
 *
 * Usage:
 *   node bin/data/migrateRequestContact.js         # dry run (prints only)
 *   node bin/data/migrateRequestContact.js --yes   # write
 *
 * Targets whatever bin/data/config.js points at (the emulator by default).
 */

require('dotenv').config();
const { db, FieldValue } = require('./fb');

const WRITE = process.argv.includes('--yes');

async function migrate() {
  // Contact details are only set on acceptance, so only these statuses carry them.
  const snap = await db.collection('serviceRequests')
    .where('status', 'in', ['assigned', 'completed', 'cancelled'])
    .get();
  const withContact = snap.docs.filter((d) => {
    const data = d.data();
    return data.customerAddress !== undefined || data.customerPhone !== undefined;
  });
  console.log(`🔎 ${snap.size} accepted/closed requests, ${withContact.length} with public contact details`);

  let moved = 0;
  for (const reqDoc of withContact) {
    const data = reqDoc.data();
    let tradieId = data.acceptedTradieId || null;
    if (!tradieId && data.acceptedQuoteId) {
      const quote = await db.collection('quotes').doc(data.acceptedQuoteId).get();
      tradieId = quote.exists ? quote.data().tradieId || null : null;
    }
    console.log(`  ${WRITE ? '→' : '•'} ${reqDoc.id}: tradie ${tradieId || '(unknown — customer-only access)'}`);
    if (WRITE) {
      const batch = db.batch();
      batch.set(reqDoc.ref.collection('private').doc('contact'), {
        customerId: data.customerId || null,
        tradieId,
        quoteId: data.acceptedQuoteId || null,
        customerAddress: data.customerAddress || null,
        customerPhone: data.customerPhone || null,
        sharedAt: data.updatedAt || FieldValue.serverTimestamp(),
      }, { merge: true });
      batch.update(reqDoc.ref, {
        customerAddress: FieldValue.delete(),
        customerPhone: FieldValue.delete(),
        ...(tradieId && !data.acceptedTradieId ? { acceptedTradieId: tradieId } : {}),
      });
      await batch.commit();
    }
    moved++;
  }

  console.log(`${WRITE ? '✅ Moved' : '📝 Would move'} contact details for ${moved} requests.`);
  if (!WRITE) console.log('   Dry run — re-run with --yes to write.');
}

migrate().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
