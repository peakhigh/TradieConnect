/**
 * Shared Firestore handle for the seed/clean/backfill scripts.
 *
 * Uses the **Admin SDK** (not the client SDK) so data-loading bypasses the
 * Firestore security rules — which is exactly what an offline seeder needs now
 * that the rules are locked down. Against the emulator it connects via
 * FIRESTORE_EMULATOR_HOST; against a real project it would need credentials.
 *
 * firebase-admin isn't a root dependency, so we resolve the copy already
 * installed in functions/ (same version the backend uses). Falls back to a
 * plain require if it's ever installed at the root.
 */
require('dotenv').config();
const path = require('path');
const config = require('./config');

let admin;
try {
  admin = require('firebase-admin');
} catch (_e) {
  admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
}

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'tradie-mate-f852a';

if (config.emulator.useEmulator) {
  // Admin SDK auto-detects this and talks to the emulator (rules bypassed).
  process.env.FIRESTORE_EMULATOR_HOST = `${config.emulator.host}:${config.emulator.firestorePort}`;
  console.log(`🔌 Admin SDK → Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
} else {
  console.log(`⚠️  Admin SDK → LIVE project "${projectId}" (no emulator)`);
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;
const FieldValue = admin.firestore.FieldValue;

// --- Client-SDK-style shims so existing script call sites work unchanged. ---
// Path segments join into a Firestore path: collection(db,'a','b','c') → 'a/b/c'.
const collection = (_db, ...segs) => db.collection(segs.join('/'));
const docRef = (_db, ...segs) => db.doc(segs.join('/'));
const addDoc = (ref, data) => ref.add(data);
const setDoc = (ref, data, opts) => ref.set(data, opts || {});
const deleteDoc = (ref) => ref.delete();
const getDocs = (q) => q.get();
const where = (field, op, val) => ({ __where: true, field, op, val });
const query = (ref, ...clauses) =>
  clauses.reduce((r, c) => (c && c.__where ? r.where(c.field, c.op, c.val) : r), ref);

module.exports = {
  admin,
  db,
  Timestamp,
  FieldValue,
  collection,
  doc: docRef,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  projectId,
};
