/**
 * Emulator-routed firebase-admin client for E2E data assertions/setup (Tradie).
 * Bypasses security rules; pointed at the emulator via *_EMULATOR_HOST. No real
 * credentials, and a hard guard prevents a prod connection.
 *
 * Env (defaults match .env.e2e / firebase.json):
 *   E2E_PROJECT_ID     default tradie-mate-f852a
 *   E2E_EMULATOR_HOST  default 127.0.0.1
 *   E2E_FIRESTORE_PORT default 8180
 *   E2E_AUTH_PORT      default 9190
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
let admin: any;
try { admin = require('firebase-admin'); }
catch (_e) { admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin')); }

const PROJECT_ID = process.env.E2E_PROJECT_ID || 'tradie-mate-f852a';
const HOST = process.env.E2E_EMULATOR_HOST || '127.0.0.1';
const FIRESTORE_PORT = process.env.E2E_FIRESTORE_PORT || '8180';
const AUTH_PORT = process.env.E2E_AUTH_PORT || '9190';

let app: any;
export function getAdmin() {
  if (app) return app;
  process.env.FIRESTORE_EMULATOR_HOST = `${HOST}:${FIRESTORE_PORT}`;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${HOST}:${AUTH_PORT}`;
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('E2E firebaseAdmin: FIRESTORE_EMULATOR_HOST not set — refusing to connect (prod risk).');
  }
  app = admin.apps.length ? admin.app() : admin.initializeApp({ projectId: PROJECT_ID });
  return app;
}
export function db() { getAdmin(); return admin.firestore(); }
export function auth() { getAdmin(); return admin.auth(); }

export async function getDoc(collection: string, id: string): Promise<any | null> {
  const snap = await db().collection(collection).doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}
export async function queryWhere(collection: string, field: string, value: any): Promise<any[]> {
  const snap = await db().collection(collection).where(field, '==', value).get();
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}
export async function count(collection: string, field?: string, value?: any): Promise<number> {
  let q: any = db().collection(collection);
  if (field !== undefined) q = q.where(field, '==', value);
  return (await q.get()).size;
}
export async function getAuthUserByPhone(phone: string): Promise<any | null> {
  try { return await auth().getUserByPhoneNumber(phone); } catch { return null; }
}
