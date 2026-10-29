import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

interface AcceptQuoteData {
  quoteId: string;
  customerAddress: string;
  customerPhone: string;
}

/**
 * Callable function: acceptQuote
 * Customer accepts a quote — updates winning quote to 'accepted',
 * rejects all others, updates serviceRequest status to 'assigned'.
 */
export const acceptQuote = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { quoteId, customerAddress, customerPhone } = request.data as AcceptQuoteData;
  const customerId = request.auth.uid;

  if (!quoteId) {
    throw new https.HttpsError('invalid-argument', 'quoteId is required');
  }

  // Check and claim inside one transaction: two quick accepts (even on two
  // different quotes) must not both win, and the price the customer accepts
  // can't be changed by a parallel editQuote. The request must still be open
  // ('new' / 'quoted'); accepting moves it to 'assigned', so a second accept
  // for the same request fails here.
  const quoteRef = db.collection('quotes').doc(quoteId);
  const { quoteData, serviceRequestData } = await db.runTransaction(async (tx) => {
    const quoteDoc = await tx.get(quoteRef);
    if (!quoteDoc.exists) {
      throw new https.HttpsError('not-found', 'Quote not found');
    }
    const quote = quoteDoc.data()!;
    const reqRef = db.collection('serviceRequests').doc(quote.serviceRequestId);
    const reqDoc = await tx.get(reqRef);
    const req = reqDoc.data();

    if (!req || req.customerId !== customerId) {
      throw new https.HttpsError('permission-denied', 'Not authorized to accept this quote');
    }
    if (quote.status !== 'quoted') {
      throw new https.HttpsError('failed-precondition', 'Quote is not in a valid state to accept');
    }
    if (!['new', 'quoted'].includes(req.status)) {
      throw new https.HttpsError('failed-precondition', 'This request is no longer open for accepting quotes.');
    }

    // 1. Winning quote → 'accepted'.
    tx.update(quoteRef, {
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
    });

    // 3. Request → 'assigned'. The request doc is readable by every signed-in
    // user (Explorer), so contact details never go on it.
    tx.update(reqRef, {
      status: 'assigned',
      acceptedQuoteId: quoteId,
      acceptedTradieId: quote.tradieId,
      customerAddress: FieldValue.delete(),
      customerPhone: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 3b. Contact details, readable only by the customer and the accepted
    // tradie (see firestore.rules: serviceRequests/{id}/private/{doc}).
    tx.set(reqRef.collection('private').doc('contact'), {
      customerId: req.customerId,
      tradieId: quote.tradieId,
      quoteId,
      customerAddress: typeof customerAddress === 'string' && customerAddress ? customerAddress : null,
      customerPhone: typeof customerPhone === 'string' && customerPhone ? customerPhone : null,
      sharedAt: FieldValue.serverTimestamp(),
    });

    return { quoteData: quote, serviceRequestData: req };
  });

  // 2. Reject all other quoted docs for same request
  const otherQuotes = await db.collection('quotes')
    .where('serviceRequestId', '==', quoteData.serviceRequestId)
    .where('status', '==', 'quoted')
    .get();

  const batch = db.batch();
  otherQuotes.docs.forEach(doc => {
    if (doc.id !== quoteId) {
      batch.update(doc.ref, { status: 'rejected' });
    }
  });
  await batch.commit();

  // Look up the accepted quote's chat room up front so notifications can
  // deep-link straight into the conversation.
  const acceptedRoomQuery = await db.collection('chatRooms')
    .where('quoteId', '==', quoteId)
    .limit(1)
    .get();
  const acceptedChatRoomId = acceptedRoomQuery.empty ? null : acceptedRoomQuery.docs[0].id;

  // 4. Notify accepted tradie
  await db.collection('notifications').add({
    userId: quoteData.tradieId,
    title: 'Quote Accepted!',
    message: `Your $${quoteData.totalPrice?.toFixed(2)} quote has been accepted. Customer details shared.`,
    type: 'quote_accepted',
    quoteId,
    serviceRequestId: quoteData.serviceRequestId,
    // Deep-link to the chat room where contact details were shared.
    ...(acceptedChatRoomId ? { itemId: acceptedChatRoomId, goto: 'chatscreen' } : {}),
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 5. Notify rejected tradies + flip their chat rooms' quoteStatus
  const rejectedDocs = otherQuotes.docs.filter(doc => doc.id !== quoteId);
  for (const rejectedDoc of rejectedDocs) {
    const rejectedData = rejectedDoc.data();
    const rejectedNotifRef = await db.collection('notifications').add({
      userId: rejectedData.tradieId,
      title: 'Quote Not Selected',
      message: `Another tradie was selected for the ${serviceRequestData.trades ? serviceRequestData.trades.join(', ') : 'service'} request.`,
      type: 'quote_rejected',
      quoteId: rejectedDoc.id,
      serviceRequestId: quoteData.serviceRequestId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Reflect rejected status on that quote's chat room (if any) and update
    // the notification we just wrote to deep-link to that room.
    const rejectedRoomQuery = await db.collection('chatRooms')
      .where('quoteId', '==', rejectedDoc.id)
      .limit(1)
      .get();
    if (!rejectedRoomQuery.empty) {
      const rejectedRoomId = rejectedRoomQuery.docs[0].id;
      await rejectedRoomQuery.docs[0].ref.update({ quoteStatus: 'rejected' });
      await rejectedNotifRef.update({ itemId: rejectedRoomId, goto: 'chatscreen' });
    }
  }

  // 6. Add system message to the chat room for this quote
  if (acceptedChatRoomId) {
    const chatRoomId = acceptedChatRoomId;

    // Reflect accepted status on the room (drives the chat-list status filter).
    await db.collection('chatRooms').doc(chatRoomId).update({
      quoteStatus: 'accepted',
    });

    // Add system message about acceptance
    await db.collection('chatRooms').doc(chatRoomId).collection('messages').add({
      type: 'system',
      text: `Quote accepted! Job address: ${customerAddress || 'not provided'}. ` +
        `Customer phone: ${customerPhone || 'not provided'}.`,
      senderId: 'system',
      senderName: 'System',
      receiverId: quoteData.tradieId,
      receiverName: quoteData.tradieName || 'Tradie',
      systemAction: 'quote_accepted',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update the quote message status inside chat
    const quoteMessages = await db.collection('chatRooms').doc(chatRoomId)
      .collection('messages')
      .where('type', '==', 'quote')
      .limit(1)
      .get();

    if (!quoteMessages.empty) {
      await quoteMessages.docs[0].ref.update({
        'quoteData.status': 'accepted',
      });
    }
  }

  return {
    success: true,
    message: 'Quote accepted successfully',
  };
});
