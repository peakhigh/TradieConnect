import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Ensures the authenticated user is a tradie who is allowed to spend money and
 * quote: must be a tradie, not suspended, and approved (or approval not yet
 * decided — we treat missing isApproved as approved for backward compatibility
 * only when the platform hasn't set it; suspended always blocks).
 *
 * Returns the tradie's user data so callers don't need to re-read it.
 */
export async function requireActiveTradie(
  tradieId: string
): Promise<FirebaseFirestore.DocumentData> {
  const tradieDoc = await db.collection('users').doc(tradieId).get();
  if (!tradieDoc.exists) {
    throw new https.HttpsError('not-found', 'Tradie not found');
  }

  const tradieData = tradieDoc.data()!;

  if (tradieData.userType !== 'tradie') {
    throw new https.HttpsError('permission-denied', 'Only tradies can perform this action');
  }

  if (tradieData.status === 'suspended') {
    throw new https.HttpsError(
      'permission-denied',
      'Your account is suspended. Please contact support.'
    );
  }

  // isApproved === false means an admin has explicitly not approved (or revoked)
  // this tradie. undefined/null is treated as "not yet gated" to avoid locking
  // out existing accounts created before the approval flow existed.
  if (tradieData.isApproved === false) {
    throw new https.HttpsError(
      'permission-denied',
      'Your account is pending approval. You can browse requests but cannot unlock or quote until approved.'
    );
  }

  return tradieData;
}
