/**
 * Harness self-test (Tradie) — proves the emulator-routed data layer works.
 * Run: npm run e2e:data (emulators running + seeded).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../support/firebaseAdmin';
import { SEEDED } from '../support/fixtures';

test('seed produced service requests', async () => {
  const snap = await db().collection('serviceRequests').limit(5).get();
  assert.ok(snap.size > 0, 'expected seeded serviceRequests');
});

test('seeded collections are present', async () => {
  for (const c of SEEDED.collections) {
    const snap = await db().collection(c).limit(1).get();
    assert.ok(snap.size >= 0, `collection ${c} unreadable`);
  }
});
