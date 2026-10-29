import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { applyRollupDelta } from '../reporting/rollups';
import { requireActiveTradie } from '../auth/tradieGuard';

const db = admin.firestore();

/** Users docs have no displayName/name; build one from the profile fields. */
function tradieDisplayName(data: FirebaseFirestore.DocumentData): string {
  const full = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  return data.businessName || full || data.displayName || data.name || 'Tradie';
}

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

  // Get tradie user doc + enforce approval/suspension gate.
  const tradieData = await requireActiveTradie(tradieId);

  const unlockCost = 0.50;
  const userRef = db.collection('users').doc(tradieId);
  const requestRef = db.collection('serviceRequests').doc(serviceRequestId);

  // Everything that reads or moves money runs in one transaction. Concurrent
  // unlocks (double tap, two tabs) all write the tradie doc, so Firestore
  // serializes them: a retry sees the first unlock and the reduced balance.
  // Without this, 3 parallel calls charged 3x and a $0.50 wallet went negative.
  const serviceRequestData = await db.runTransaction(async (tx) => {
    const [userSnap, existingUnlock, requestSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(db.collection('quotes')
        .where('tradieId', '==', tradieId)
        .where('serviceRequestId', '==', serviceRequestId)
        .limit(1)),
      tx.get(requestRef),
    ]);

    const walletBalance = userSnap.data()?.walletBalance || 0;
    if (walletBalance < unlockCost) {
      throw new https.HttpsError('failed-precondition', 'Insufficient wallet balance. Please recharge your wallet.');
    }
    if (!existingUnlock.empty) {
      throw new https.HttpsError('already-exists', 'You have already unlocked this request');
    }
    if (!requestSnap.exists) {
      throw new https.HttpsError('not-found', 'Service request not found');
    }
    const requestData = requestSnap.data()!;
    if (requestData.status !== 'new' && requestData.status !== 'active' && requestData.status !== 'quoted') {
      throw new https.HttpsError('failed-precondition', 'Service request is no longer available');
    }

    // 1. Deduct $0.50 from wallet
    tx.update(userRef, { walletBalance: FieldValue.increment(-unlockCost) });

    // 2. Create quotes doc with status: 'unlocked'
    tx.set(db.collection('quotes').doc(), {
      tradieId,
      // Denormalized so the customer can query (and the rules can authorize)
      // their quotes without a join, and so the tradie's History/Dashboard can
      // label the job without reading the request.
      customerId: requestData.customerId,
      serviceRequestId,
      trades: requestData.trades || [],
      postcode: requestData.postcode || '',
      suburb: requestData.suburb || '',
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
      tradieName: tradieDisplayName(tradieData),
      tradieRating: tradieData.rating || 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 3. Create walletTransactions record
    tx.set(db.collection('walletTransactions').doc(), {
      userId: tradieId,
      type: 'unlock',
      amount: -unlockCost,
      description: `Unlocked service request: ${requestData.trades ? requestData.trades.join(', ') : 'Service'}`,
      referenceId: serviceRequestId,
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });

    // 4. Update serviceRequest intel fields
    const currentUnlocks = (requestData.intel_totalUnlocks || 0) + 1;
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
    const currentQuotes = requestData.intel_totalQuotes || 0;
    if (currentUnlocks > 3 && currentQuotes < 3) {
      const currentScore = requestData.intel_opportunityScore || 50;
      intelUpdates.intel_opportunityScore = Math.min(currentScore + 5, 100);
    }

    tx.update(requestRef, intelUpdates);
    return requestData;
  });

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
