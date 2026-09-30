/**
 * Seed resolvers/cleanup for specs (Tradie). Bulk seed = bin/data/seed.js.
 * Ids vary per run, so specs resolve by relationship at runtime.
 */
import { db, queryWhere } from './firebaseAdmin';

export async function serviceRequestsForCustomer(customerId: string): Promise<any[]> {
  // seed links requests to the configured customer; field name may be customerId/userId/ownerId.
  for (const f of ['customerId', 'userId', 'ownerId', 'createdBy']) {
    const rows = await queryWhere('serviceRequests', f, customerId);
    if (rows.length) return rows;
  }
  return [];
}
export async function quotesForTradie(tradieId: string): Promise<any[]> {
  for (const f of ['tradieId', 'userId', 'createdBy']) {
    const rows = await queryWhere('quotes', f, tradieId);
    if (rows.length) return rows;
  }
  return [];
}
export async function walletTxnsForUser(userId: string): Promise<any[]> {
  for (const f of ['userId', 'tradieId', 'ownerId', 'walletOwnerId']) {
    const rows = await queryWhere('walletTransactions', f, userId);
    if (rows.length) return rows;
  }
  return [];
}
export async function anyOpenServiceRequest(): Promise<any | null> {
  const snap = await db().collection('serviceRequests').limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}
