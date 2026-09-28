import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { applyRollupDelta } from '../reporting/rollups';
import { refundUnlocks } from '../payments/refundUnlocks';

const db = admin.firestore();

interface CancelData {
  serviceRequestId: string;
  reason?: string;
}

/**
 * Callable: cancelServiceRequest
 *
 * Customer cancels their own request. Works for 'new', 'quoted', AND 'assigned'
 * requests:
 *  - Sets status → 'cancelled'.
 *  - If a tradie was assigned, un-assigns them, marks the accepted quote
 *    'cancelled', notifies the assigned tradie, and flips their chat room.
 *  - Refunds the unlock fee to every non-winning tradie who unlocked it.
 *  - Updates reporting rollups.
 *
 * This replaces the previous client-side direct write so cancellation of an
 * assigned job is handled safely and atomically server-side.
 */
export const cancelServiceRequest = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { serviceRequestId, reason } = (request.data || {}) as CancelData;
  const customerId = request.auth.uid;

  if (!serviceRequestId) {
    throw new https.HttpsError('invalid-argument', 'serviceRequestId is required');
  }

  const reqRef = db.collection('serviceRequests').doc(serviceRequestId);
  const reqDoc = await reqRef.get();
  if (!reqDoc.exists) {
    throw new https.HttpsError('not-found', 'Service request not found');
  }

  const data = reqDoc.data()!;
  if (data.customerId !== customerId) {
    throw new https.HttpsError('permission-denied', 'Not authorized to cancel this request');
  }

  const currentStatus = data.status;
  if (currentStatus === 'completed' || currentStatus === 'cancelled' || currentStatus === 'expired') {
    throw new https.HttpsError(
      'failed-precondition',
      `A ${currentStatus} request can't be cancelled.`
    );
  }

  const wasAssigned = currentStatus === 'assigned';
  const acceptedQuoteId = data.acceptedQuoteId || null;
  const tradeDisplay = data.trades ? data.trades.join(', ') : 'service';

  // 1. Update the request.
  await reqRef.update({
    status: 'cancelled',
    cancelledAt: FieldValue.serverTimestamp(),
    cancelReason: reason || null,
    // Clear assignment fields when cancelling an assigned job.
    ...(wasAssigned ? { acceptedQuoteId: null } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 2. If it was assigned, un-assign + notify the assigned tradie.
  if (wasAssigned && acceptedQuoteId) {
    const acceptedQuoteRef = db.collection('quotes').doc(acceptedQuoteId);
    const acceptedQuoteDoc = await acceptedQuoteRef.get();
    if (acceptedQuoteDoc.exists) {
      const acceptedQuote = acceptedQuoteDoc.data()!;
      await acceptedQuoteRef.update({ status: 'cancelled' });

      if (acceptedQuote.tradieId) {
        await db.collection('notifications').add({
          userId: acceptedQuote.tradieId,
          title: 'Job cancelled',
          message: `The customer cancelled the ${tradeDisplay} job you were assigned to.`,
          type: 'job_cancelled',
          serviceRequestId,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Flip the chat room + drop a system message.
        const roomSnap = await db
          .collection('chatRooms')
          .where('quoteId', '==', acceptedQuoteId)
          .limit(1)
          .get();
        if (!roomSnap.empty) {
          const roomRef = roomSnap.docs[0].ref;
          await roomRef.update({ quoteStatus: 'rejected', status: 'closed' });
          await roomRef.collection('messages').add({
            type: 'system',
            text: 'The customer cancelled this job.',
            senderId: 'system',
            senderName: 'System',
            receiverId: acceptedQuote.tradieId,
            receiverName: acceptedQuote.tradieName || 'Tradie',
            systemAction: 'job_cancelled',
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }
  }

  // 3. Refund every non-winning tradie who unlocked the request.
  //    (If it was assigned, the accepted tradie is excluded — they won the job
  //    and completed the unlock for a real opportunity.)
  const refundResult = await refundUnlocks(
    serviceRequestId,
    'request cancelled',
    wasAssigned ? (await getAcceptedTradieId(acceptedQuoteId)) : null
  );

  // 4. Reporting: remove from active count (only if it was still active).
  if (currentStatus === 'new' || currentStatus === 'quoted' || currentStatus === 'assigned') {
    await applyRollupDelta(
      { suburb: data.suburb, postcode: data.postcode, state: data.state, trades: data.trades || [] },
      { activeRequestCount: -1 }
    );
  }

  return {
    success: true,
    message: 'Request cancelled',
    refunded: refundResult.refundedCount,
  };
});

async function getAcceptedTradieId(quoteId: string | null): Promise<string | null> {
  if (!quoteId) return null;
  const doc = await db.collection('quotes').doc(quoteId).get();
  return doc.exists ? doc.data()?.tradieId || null : null;
}
