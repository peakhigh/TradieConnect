import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

interface DeclineQuoteData {
  quoteId: string;
}

/**
 * Callable function: declineQuote
 * Customer declines a single quote (status → 'rejected'), notifies the tradie,
 * and adds a system message to the related chat room.
 *
 * This does NOT change the service request status — other quotes remain open.
 */
export const declineQuote = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { quoteId } = request.data as DeclineQuoteData;
  const customerId = request.auth.uid;

  if (!quoteId) {
    throw new https.HttpsError('invalid-argument', 'quoteId is required');
  }

  // Check and update in one transaction so a decline can't overwrite a quote
  // that a parallel accept/withdraw has just moved on from 'quoted'.
  const quoteRef = db.collection('quotes').doc(quoteId);
  const { quoteData, serviceRequestData } = await db.runTransaction(async (tx) => {
    const quoteDoc = await tx.get(quoteRef);
    if (!quoteDoc.exists) {
      throw new https.HttpsError('not-found', 'Quote not found');
    }
    const quote = quoteDoc.data()!;
    const reqDoc = await tx.get(db.collection('serviceRequests').doc(quote.serviceRequestId));
    const req = reqDoc.data();

    // Verify the customer owns the related service request.
    if (!req || req.customerId !== customerId) {
      throw new https.HttpsError('permission-denied', 'Not authorized to decline this quote');
    }
    // Only pending/quoted quotes can be declined.
    if (quote.status !== 'quoted') {
      throw new https.HttpsError('failed-precondition', 'Only an active quote can be declined');
    }

    // 1. Mark the quote rejected.
    tx.update(quoteRef, {
      status: 'rejected',
      rejectedAt: FieldValue.serverTimestamp(),
    });
    return { quoteData: quote, serviceRequestData: req };
  });

  // 2. Notify the tradie.
  await db.collection('notifications').add({
    userId: quoteData.tradieId,
    title: 'Quote Declined',
    message: `Your $${quoteData.totalPrice?.toFixed(2)} quote for the ${
      serviceRequestData.trades ? serviceRequestData.trades.join(', ') : 'service'
    } request was declined.`,
    type: 'quote_rejected',
    quoteId,
    serviceRequestId: quoteData.serviceRequestId,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 3. Add a system message to the chat room (if one exists) + reflect status on the quote card.
  const chatRoomQuery = await db.collection('chatRooms')
    .where('quoteId', '==', quoteId)
    .limit(1)
    .get();

  if (!chatRoomQuery.empty) {
    const chatRoomId = chatRoomQuery.docs[0].id;

    await db.collection('chatRooms').doc(chatRoomId).update({ quoteStatus: 'rejected' });

    await db.collection('chatRooms').doc(chatRoomId).collection('messages').add({
      type: 'system',
      text: 'The customer declined this quote.',
      senderId: 'system',
      senderName: 'System',
      receiverId: quoteData.tradieId,
      receiverName: quoteData.tradieName || 'Tradie',
      systemAction: 'quote_rejected',
      createdAt: FieldValue.serverTimestamp(),
    });

    const quoteMessages = await db.collection('chatRooms').doc(chatRoomId)
      .collection('messages')
      .where('type', '==', 'quote')
      .limit(1)
      .get();

    if (!quoteMessages.empty) {
      await quoteMessages.docs[0].ref.update({
        'quoteData.status': 'rejected',
      });
    }
  }

  return {
    success: true,
    message: 'Quote declined',
  };
});
