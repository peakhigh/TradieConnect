import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { recalculateIntelligence } from './intelligence';
import { parseQuoteFields } from './quoteFields';
import { applyRollupDelta } from '../reporting/rollups';
import { requireActiveTradie, tradieDisplayName } from '../auth/tradieGuard';

const db = admin.firestore();

interface SubmitQuoteData {
  serviceRequestId: string;
  totalPrice: number;
  materialsCost: number;
  laborCost: number;
  timelineDays: number;
  estimatedStartDate: string;
  estimatedCompletionDate: string;
  notes: string;
}

/**
 * Callable function: submitQuote
 * Updates existing quotes doc from 'unlocked' to 'quoted',
 * recalculates all intelligence fields, notifies customer.
 */
export const submitQuote = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {
    serviceRequestId,
    totalPrice,
    materialsCost,
    laborCost,
    timelineDays,
    estimatedStartDate,
    estimatedCompletionDate,
    notes,
  } = request.data as SubmitQuoteData;

  const tradieId = request.auth.uid;

  if (typeof serviceRequestId !== 'string' || !serviceRequestId) {
    throw new https.HttpsError('invalid-argument', 'Missing required fields');
  }
  const fields = parseQuoteFields(request.data as SubmitQuoteData);

  // Enforce approval/suspension gate before allowing a quote.
  const tradieData = await requireActiveTradie(tradieId);

  // 1. Find the tradie's unlock for this request.
  const unlockQuery = await db.collection('quotes')
    .where('tradieId', '==', tradieId)
    .where('serviceRequestId', '==', serviceRequestId)
    .where('status', 'in', ['unlocked', 'quoted'])
    .limit(1)
    .get();

  if (unlockQuery.empty) {
    throw new https.HttpsError(
      'permission-denied',
      'You must unlock this request before submitting a quote. No unlocked entry found.'
    );
  }

  const quoteDocRef = unlockQuery.docs[0].ref;
  const requestRef = db.collection('serviceRequests').doc(serviceRequestId);

  // 2. unlocked → quoted inside a transaction, so a double tap can't submit
  //    twice (two notifications, two chat rooms, double-counted rollups), and
  //    only while the request is still open to quotes.
  await db.runTransaction(async (tx) => {
    const [quoteSnap, requestSnap] = await Promise.all([tx.get(quoteDocRef), tx.get(requestRef)]);
    if (quoteSnap.data()?.status !== 'unlocked') {
      throw new https.HttpsError(
        'already-exists',
        'You have already submitted a quote for this request.'
      );
    }
    if (!requestSnap.exists || !['new', 'quoted'].includes(requestSnap.data()?.status)) {
      throw new https.HttpsError(
        'failed-precondition',
        'This request is no longer accepting quotes.'
      );
    }
    tx.update(quoteDocRef, {
      ...fields,
      status: 'quoted',
      quotedAt: FieldValue.serverTimestamp(),
    });
  });

  // 3. Fetch ALL quotes for this serviceRequestId where status in ['quoted', 'accepted', 'rejected']
  const allQuotesQuery = await db.collection('quotes')
    .where('serviceRequestId', '==', serviceRequestId)
    .where('status', 'in', ['quoted', 'accepted', 'rejected'])
    .get();

  const quotedDocs = allQuotesQuery.docs.map(doc => {
    const data = doc.data();
    return {
      totalPrice: data.totalPrice,
      materialsCost: data.materialsCost,
      laborCost: data.laborCost,
      timelineDays: data.timelineDays,
      quotedAt: data.quotedAt,
    };
  });

  // 4. Get current unlock count from serviceRequest
  const serviceRequestDoc = await db.collection('serviceRequests').doc(serviceRequestId).get();
  const serviceRequestData = serviceRequestDoc.data();
  const currentUnlocks = serviceRequestData?.intel_totalUnlocks || 0;
  const requestCreatedAt = serviceRequestData?.createdAt || null;

  // 5. Recalculate intelligence
  const intelFields = recalculateIntelligence(quotedDocs, currentUnlocks, requestCreatedAt);

  // 6. Write all intel_* fields back to serviceRequests/{serviceRequestId}
  await db.collection('serviceRequests').doc(serviceRequestId).update({
    ...intelFields,
    // Also update status to 'quoted' if it was 'new'
    ...(serviceRequestData?.status === 'new' ? { status: 'quoted' } : {}),
    // A new quote is activity: expireStaleRequests measures from updatedAt.
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 6b. Reporting rollups: a new quote adds quoteCount + quoted value.
  await applyRollupDelta(
    {
      suburb: serviceRequestData?.suburb,
      postcode: serviceRequestData?.postcode,
      state: serviceRequestData?.state,
      trades: serviceRequestData?.trades || [],
    },
    { quoteCount: 1, totalQuotedValue: totalPrice }
  );

  // 7. Create notification for customer
  if (serviceRequestData?.customerId) {
    await db.collection('notifications').add({
      userId: serviceRequestData.customerId,
      title: 'New Quote Received',
      message: `You received a $${totalPrice.toFixed(2)} quote for your ${serviceRequestData.trades ? serviceRequestData.trades.join(', ') : 'service'} request`,
      type: 'quote',
      serviceRequestId,
      // itemId + goto drive in-app deep-linking to the live quotes screen.
      itemId: serviceRequestId,
      goto: 'requestdetail',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  // 8. Create chatRoom between tradie and customer
  const tradieName = tradieDisplayName(tradieData);
  const customerName = serviceRequestData?.customerName || 'Customer';
  const customerId = serviceRequestData?.customerId || '';
  const tradeDisplay = serviceRequestData?.trades ? serviceRequestData.trades.join(', ') : 'Service';

  const chatRoomData = {
    serviceRequestId,
    quoteId: quoteDocRef.id,
    customerId,
    customerName,
    tradieId,
    tradieName,
    trades: serviceRequestData?.trades || [],
    suburb: serviceRequestData?.suburb || serviceRequestData?.postcode || '',
    quoteStatus: 'pending',
    participants: [customerId, tradieId],
    status: 'active',
    lastMessage: `Quote: $${totalPrice.toFixed(2)} for ${tradeDisplay}`,
    lastMessageType: 'quote',
    lastMessageAt: FieldValue.serverTimestamp(),
    unreadByCustomer: 1,
    unreadByTradie: 0,
    createdAt: FieldValue.serverTimestamp(),
  };

  const chatRoomRef = await db.collection('chatRooms').add(chatRoomData);

  // 9. Add the quote as the first message in the chat
  await db.collection('chatRooms').doc(chatRoomRef.id).collection('messages').add({
    type: 'quote',
    text: `Quote: $${totalPrice.toFixed(2)} for ${tradeDisplay}`,
    senderId: tradieId,
    senderName: tradieName,
    receiverId: customerId,
    receiverName: customerName,
    quoteData: {
      quoteId: quoteDocRef.id,
      totalPrice,
      materialsCost,
      laborCost,
      timelineDays,
      estimatedStartDate: estimatedStartDate || null,
      estimatedCompletionDate: estimatedCompletionDate || null,
      notes: notes || null,
      tradieName,
      tradieRating: tradieData?.rating || 0,
      trades: serviceRequestData?.trades || [],
      postcode: serviceRequestData?.postcode || '',
      status: 'pending',
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  // 10. Add system message
  await db.collection('chatRooms').doc(chatRoomRef.id).collection('messages').add({
    type: 'system',
    text: `${tradieName} submitted a quote for $${totalPrice.toFixed(2)}`,
    senderId: 'system',
    senderName: 'System',
    receiverId: customerId,
    receiverName: customerName,
    systemAction: 'quote_submitted',
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    message: 'Quote submitted successfully',
    chatRoomId: chatRoomRef.id,
  };
});
