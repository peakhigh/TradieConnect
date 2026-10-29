import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { refundUnlocks } from '../payments/refundUnlocks';
import { applyRollupDelta } from '../reporting/rollups';

const db = admin.firestore();

/**
 * Callable: deleteUserData
 * Soft-deletes the authenticated user's account: marks the user doc deleted,
 * scrubs PII, and disables the Auth account. We avoid hard-deleting historical
 * marketplace records (quotes, transactions) to preserve financial integrity,
 * but we anonymize the profile and revoke access.
 */
export const deleteUserData = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const uid = request.auth.uid;

  try {
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      throw new https.HttpsError('not-found', 'User not found');
    }

    // Anonymize + flag deleted. Keep userType so historical joins still resolve.
    await userRef.update({
      status: 'deleted',
      deletedAt: FieldValue.serverTimestamp(),
      firstName: 'Deleted',
      lastName: 'User',
      displayName: 'Deleted User',
      email: null,
      phoneNumber: null,
      fcmToken: null,
      address: null,
      businessName: null,
      // Tradie identity details from onboarding.
      abn: FieldValue.delete(),
      businessAddress: FieldValue.delete(),
      licenceDetails: FieldValue.delete(),
      insuranceDetails: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Close any active chat rooms so they stop surfacing.
    const roomsAsCustomer = await db.collection('chatRooms').where('customerId', '==', uid).get();
    const roomsAsTradie = await db.collection('chatRooms').where('tradieId', '==', uid).get();
    const batch = db.batch();
    [...roomsAsCustomer.docs, ...roomsAsTradie.docs].forEach((d) => {
      batch.update(d.ref, { status: 'closed' });
    });
    await batch.commit();

    // Withdraw the customer's open requests: nobody can complete them now, so
    // they must leave the Explorer (tradies would otherwise keep paying to
    // unlock them) and any unlock fees already paid are refunded.
    const openRequests = await db.collection('serviceRequests')
      .where('customerId', '==', uid)
      .where('status', 'in', ['new', 'quoted'])
      .get();
    for (const reqDoc of openRequests.docs) {
      const data = reqDoc.data();
      await reqDoc.ref.update({
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        cancelReason: 'account deleted',
        updatedAt: FieldValue.serverTimestamp(),
      });
      await refundUnlocks(reqDoc.id, 'customer account closed');
      await applyRollupDelta(
        { suburb: data.suburb, postcode: data.postcode, state: data.state, trades: data.trades || [] },
        { activeRequestCount: -1 }
      );
    }

    // Revoke access + disable the Auth account.
    try {
      await admin.auth().revokeRefreshTokens(uid);
      await admin.auth().updateUser(uid, { disabled: true });
    } catch (authErr: any) {
      // Auth user may not exist (e.g. test data) — don't fail the whole op.
      console.log('Auth disable skipped:', authErr?.message);
    }

    return { success: true, message: 'Your account has been deleted.' };
  } catch (error: any) {
    if (error?.code) throw error;
    console.error('deleteUserData error:', error);
    throw new https.HttpsError('internal', 'Failed to delete account');
  }
});
