#!/usr/bin/env node
/*
 * e2e-verify-isolation.js — Phase 0 safety check (TradieConnect).
 *
 * Confirms the E2E env is isolated from the live project:
 *   1. All four emulator flags on in the active .env.
 *   2. Firestore + Auth emulators reachable on their ports.
 *   3. Seed data readable via the emulator-routed Admin SDK (never prod).
 *
 * Never connects to the real project — refuses to run unless LOCAL_FIRESTORE
 * is enabled, and only hits localhost emulator ports.
 *
 * Usage: npm run e2e:verify-isolation
 */
const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'tradie-mate-f852a';
const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
const fsPort = parseInt(process.env.EXPO_PUBLIC_EMULATOR_FIRESTORE_PORT || '8180', 10);
const authPort = parseInt(process.env.EXPO_PUBLIC_EMULATOR_AUTH_PORT || '9190', 10);

const flags = {
  firestore: process.env.EXPO_PUBLIC_LOCAL_FIRESTORE === 'true',
  auth: process.env.EXPO_PUBLIC_LOCAL_AUTH === 'true',
  storage: process.env.EXPO_PUBLIC_LOCAL_STORAGE === 'true',
  functions: process.env.EXPO_PUBLIC_LOCAL_FUNCTIONS === 'true',
};

let failures = 0;
const ok = (m) => console.log(`  \u2705 ${m}`);
const bad = (m) => { console.log(`  \u274c ${m}`); failures++; };
const warn = (m) => console.log(`  \u26a0\ufe0f  ${m}`);

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = ''; res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error('timeout')));
  });
}

async function main() {
  console.log('\n=== E2E isolation verification (TradieConnect) ===');
  console.log(`Project: ${projectId}  |  host: ${host}\n`);

  console.log('1) Emulator flags in active .env:');
  if (!flags.firestore) {
    bad('EXPO_PUBLIC_LOCAL_FIRESTORE is not "true" — refusing to run (prod risk). Run `npm run e2e:env` first.');
    process.exit(1);
  }
  Object.entries(flags).forEach(([k, v]) => (v ? ok(`${k} emulator enabled`) : bad(`${k} emulator NOT enabled`)));

  console.log('\n2) Emulator reachability:');
  try { const r = await get(`http://${host}:${fsPort}/`); (r.status && r.status < 500) ? ok(`Firestore emulator on ${host}:${fsPort}`) : bad(`Firestore status ${r.status}`); }
  catch (e) { bad(`Firestore emulator NOT reachable on ${host}:${fsPort} (${e.message}). Start: npm run e2e:emulators`); }
  try { const r = await get(`http://${host}:${authPort}/emulator/v1/projects/${projectId}/config`); r.status === 200 ? ok(`Auth emulator on ${host}:${authPort}`) : warn(`Auth emulator status ${r.status}`); }
  catch (e) { warn(`Auth emulator not reachable on ${host}:${authPort} (${e.message}).`); }

  console.log('\n3) Data check via Admin SDK (emulator-routed, never prod):');
  try {
    process.env.FIRESTORE_EMULATOR_HOST = `${host}:${fsPort}`;
    let admin;
    try { admin = require('firebase-admin'); }
    catch (_e) { admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin')); }
    if (!admin.apps.length) admin.initializeApp({ projectId });
    const snap = await admin.firestore().collection('serviceRequests').limit(5).get();
    snap.size > 0 ? ok(`Read ${snap.size} serviceRequests from the EMULATOR (seed present).`) : warn('Emulator reachable but no serviceRequests — run `npm run e2e:seed`.');
  } catch (e) { warn(`Could not query emulator via Admin SDK (${e.message}).`); }

  console.log('\n=== Result ===');
  if (failures > 0) { console.log(`\u274c ${failures} check(s) failed. NOT isolated/ready.`); process.exit(1); }
  console.log('\u2705 Environment is isolated to the emulator suite. Safe for E2E runs.');
}
main().catch((e) => { console.error(e); process.exit(1); });
