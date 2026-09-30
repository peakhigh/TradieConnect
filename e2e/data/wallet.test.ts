/**
 * Phase 3 (data) — wallet ledger invariants (Tradie). No UI.
 * Money-safety regression guards over seeded + flow-produced state.
 * Run: npm run e2e:data (emulators seeded).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../support/firebaseAdmin';

test('unlock transactions are negative; recharge/bonus are positive', async () => {
  const snap = await db().collection('walletTransactions').get();
  assert.ok(!snap.empty, 'expected seeded walletTransactions');
  for (const d of snap.docs) {
    const t = d.data();
    if (t.type === 'unlock') {
      assert.ok(t.amount < 0, `unlock ${d.id} should be negative, got ${t.amount}`);
    } else if (t.type === 'recharge' || t.type === 'bonus') {
      assert.ok(t.amount > 0, `${t.type} ${d.id} should be positive, got ${t.amount}`);
    }
  }
});

test('every wallet transaction belongs to a real user', async () => {
  const snap = await db().collection('walletTransactions').get();
  const userCache: Record<string, boolean> = {};
  for (const d of snap.docs) {
    const t = d.data();
    const uid = t.userId;
    assert.ok(uid, `txn ${d.id} has no userId`);
    if (!(uid in userCache)) {
      const u = await db().collection('users').doc(uid).get();
      userCache[uid] = u.exists;
    }
    assert.ok(userCache[uid], `txn ${d.id} references missing user ${uid}`);
  }
});
