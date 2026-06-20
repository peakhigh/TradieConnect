import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { applyRollupDelta } from '../reporting/rollups';

const db = admin.firestore();

interface UnlockRequestData {
  serviceRequestId: string;
}

/**
 * Callable function: unlockServiceRequest
 * Deducts $0.50 from tradie wallet, creates quotes doc (status: 'unlocked'),
 * creates walletTransactions record, updates intel on serviceRequest.
 */
export const unlockServiceRequest = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { serviceRequestId } = request.data as UnlockRequestData;
  const tradieId = request.auth.uid;

  if (!serviceRequestId) {
    throw new https.HttpsError('invalid-argument', 'serviceRequestId is required');
  }

  // Get tradie user doc
  const tradieDoc = await db.collection('users').doc(tradieId).get();
  if (!tradieDoc.exists) {
    throw new https.HttpsError('not-found', 'Tradie not found');
  }

  const tradieData = tradieDoc.data()!;
  if (tradieData.userType !== 'tradie') {
    throw new https.HttpsError('permission-denied', 'Only tradies can unlock requests');
  }

  const unlockCost = 0.50;
  const walletBalance = tradieData.walletBalance || 0;
  if (walletBalance < unlockCost) {
    throw new https.HttpsError('failed-precondition', 'Insufficient wallet balance. Please recharge your wallet.');
  }

  // Check if already unlocked
  const existingUnlock = await db.collection('quotes')
    .where('tradieId', '==', tradieId)
    .where('serviceRequestId', '==', serviceRequestId)
    .limit(1)
    .get();

  if (!existingUnlock.empty) {
    throw new https.HttpsError('already-exists', 'You have already unlocked this request');
  }

  // Get service request
  const serviceRequestDoc = await db.collection('serviceRequests').doc(serviceRequestId).get();
  if (!serviceRequestDoc.exists) {
    throw new https.HttpsError('not-found', 'Service request not found');
  }

  const serviceRequestData = serviceRequestDoc.data()!;
  if (serviceRequestData.status !== 'new' && serviceRequestData.status !== 'active' && serviceRequestData.status !== 'quoted') {
    throw new https.HttpsError('failed-precondition', 'Service request is no longer available');
  }

  // 1. Deduct $0.50 from wallet
  await db.collection('users').doc(tradieId).update({
    walletBalance: FieldValue.increment(-unlockCost),
  });

  // 2. Create quotes doc with status: 'unlocked'
  const quoteData = {
    tradieId,
    serviceRequestId,
    status: 'unlocked',
    unlockAmount: unlockCost,
    unlockedAt: FieldValue.serverTimestamp(),
    totalPrice: null,
    materialsCost: null,
    laborCost: null,
    timelineDays: null,
    estimatedStartDate: null,
    estimatedCompletionDate: null,
    notes: null,
    quotedAt: null,
    acceptedAt: null,
    tradieName: tradieData.displayName || tradieData.name || 'Unknown',
    tradieRating: tradieData.rating || 0,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection('quotes').add(quoteData);

  // 3. Create walletTransactions record
  await db.collection('walletTransactions').add({
    userId: tradieId,
    type: 'unlock',
    amount: -unlockCost,
    description: `Unlocked service request: ${serviceRequestData.trades ? serviceRequestData.trades.join(', ') : 'Service'}`,
    referenceId: serviceRequestId,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp(),
  });

  // 4. Update serviceRequest intel fields
  const currentUnlocks = (serviceRequestData.intel_totalUnlocks || 0) + 1;
  const intelUpdates: Record<string, any> = {
    intel_totalUnlocks: FieldValue.increment(1),
    intel_updatedAt: FieldValue.serverTimestamp(),
  };

  // Update demand level based on new unlock count
  if (currentUnlocks > 10) {
    intelUpdates.intel_demandLevel = 'high';
  } else if (currentUnlocks > 5) {
    intelUpdates.intel_demandLevel = 'medium';
  }

  // Boost opportunity if many unlocks but few quotes
  const currentQuotes = serviceRequestData.intel_totalQuotes || 0;
  if (currentUnlocks > 3 && currentQuotes < 3) {
    const currentScore = serviceRequestData.intel_opportunityScore || 50;
    intelUpdates.intel_opportunityScore = Math.min(currentScore + 5, 100);
  }

  await db.collection('serviceRequests').doc(serviceRequestId).update(intelUpdates);

  // Reporting rollups: record the unlock.
  await applyRollupDelta(
    {
      suburb: serviceRequestData.suburb,
      postcode: serviceRequestData.postcode,
      state: serviceRequestData.state,
      trades: serviceRequestData.trades || [],
    },
    { unlockCount: 1 }
  );

  // 5. Return success with full request data
  return {
    success: true,
    message: 'Service request unlocked successfully',
    unlockCost,
    request: {
      id: serviceRequestId,
      ...serviceRequestData,
    },
  };
});
