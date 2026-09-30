/**
 * Data-layer assertions for E2E flows (Tradie). Read via the emulator-routed
 * Admin SDK; throw on mismatch (works under Playwright and node:test).
 */
import { getDoc, queryWhere, count, getAuthUserByPhone } from './firebaseAdmin';

function fail(msg: string): never { throw new Error(`[assertData] ${msg}`); }

export async function assertDocExists(collection: string, id: string, fields?: Record<string, any>): Promise<any> {
  const doc = await getDoc(collection, id);
  if (!doc) fail(`expected ${collection}/${id} to exist`);
  if (fields) for (const [k, v] of Object.entries(fields)) {
    if (JSON.stringify(doc[k]) !== JSON.stringify(v)) fail(`${collection}/${id}.${k}=${JSON.stringify(doc[k])}, expected ${JSON.stringify(v)}`);
  }
  return doc;
}
export async function assertCount(collection: string, expected: number, field?: string, value?: any): Promise<void> {
  const actual = await count(collection, field, value);
  if (actual !== expected) fail(`expected ${expected} in ${collection}${field ? ` where ${field}==${JSON.stringify(value)}` : ''}, found ${actual}`);
}
export async function assertHasDocs(collection: string, field: string, value: any): Promise<any[]> {
  const rows = await queryWhere(collection, field, value);
  if (rows.length === 0) fail(`expected >=1 doc in ${collection} where ${field}==${JSON.stringify(value)}`);
  return rows;
}
export async function assertAuthUserByPhone(phone: string): Promise<any> {
  const u = await getAuthUserByPhone(phone);
  if (!u) fail(`expected an Auth user for phone ${phone}`);
  return u;
}
