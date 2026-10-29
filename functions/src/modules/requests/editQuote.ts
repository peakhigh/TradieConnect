import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { recalculateIntelligence } from './intelligence';
import { parseQuoteFields } from './quoteFields';
import { applyRollupDelta } from '../reporting/rollups';
import { requireActiveTradie } from '../auth/tradieGuard';

const db = admin.firestore();

interface EditQuoteData {
  quoteId: string;
  totalPrice: number;
  materialsCost: number;
  laborCost: number;
  timelineDays: number;
  estimatedStartDate?: string;
  estimatedCompletionDate?: string;
  notes?: string;
}

/**
 * Recompute + write a request's intelligence from all its priced quotes.
 * Shared by submit/edit/withdraw flows.
 */
async function refreshRequestIntelligence(
  serviceRequestId: string
): Promise<FirebaseFirestore.DocumentData | undefined> {
  const allQuotesQuery = await db
    .collection('quotes')
    .where('serviceRequestId', '==', serviceRequestId)
    .where('status', 'in', ['quoted', 'accepted', 'rejected'])
    .get();

  const quotedDocs = allQuotesQuery.docs.map((d) => {
    const data = d.data();
    return {
      totalPrice: data.totalPrice,
      materialsCost: data.materialsCost,
      laborCost: data.laborCost,
      timelineDays: data.timelineDays,
      quotedAt: data.quotedAt,
    };
  });

  const serviceRequestDoc = await db.collection('serviceRequests').doc(serviceRequestId).get();
  const serviceRequestData = serviceRequestDoc.data();
  const currentUnlocks = serviceRequestData?.intel_totalUnlocks || 0;
  const requestCreatedAt = serviceRequestData?.createdAt || null;

  const intelFields = recalculateIntelligence(quotedDocs, currentUnlocks, requestCreatedAt);

  // If no priced quotes remain, drop status back to 'new' so it's discoverable.
  const statusPatch =
    quotedDocs.length === 0 && serviceRequestData?.status === 'quoted' ? { status: 'new' } : {};

  await db.collection('serviceRequests').doc(serviceRequestId).update({
    ...intelFields,
    ...statusPatch,
  });
  return serviceRequestData;
}

/**
 * Load the caller's quote and run `apply` in a transaction while it is still
 * 'quoted', so an edit or withdrawal can't land on a quote the customer has
 * just accepted (or one already withdrawn by a parallel call).
 */
async function updateOwnQuotedQuote(
  quoteId: string,
  tradieId: string,
  action: 'edited' | 'withdrawn',
  apply: (tx: FirebaseFirestore.Transaction, ref: FirebaseFirestore.DocumentReference) => void
): Promise<FirebaseFirestore.DocumentData> {
  const quoteRef = db.collection('quotes').doc(quoteId);
  return db.runTransaction(async (tx) => {
    const quoteDoc = await tx.get(quoteRef);
    if (!quoteDoc.exists) {
      throw new https.HttpsError('not-found', 'Quote not found');
    }
    const quote = quoteDoc.data()!;
    if (quote.tradieId !== tradieId) {
      throw new https.HttpsError('permission-denied', `You can only ${action === 'edited' ? 'edit' : 'withdraw'} your own quote`);
    }
    if (quote.status !== 'quoted') {
      throw new https.HttpsError(
        'failed-precondition',
        quote.status === 'accepted'
          ? `An accepted quote cannot be ${action}.`
          : `This quote can no longer be ${action}.`
      );
    }
    apply(tx, quoteRef);
    return quote;
  });
}

function rollupScope(req: FirebaseFirestore.DocumentData | undefined) {
  return { suburb: req?.suburb, postcode: req?.postcode, state: req?.state, trades: req?.trades || [] };
}

/**
 * Callable: editQuote
 * A tradie updates the pricing/details of a quote they've already submitted,
 * as long as it hasn't been accepted or rejected. Recomputes intelligence and
 * updates the quote message in the chat so the customer sees the new figures.
 */
export const editQuote = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { quoteId } = request.data as EditQuoteData;
  const tradieId = request.auth.uid;

  if (typeof quoteId !== 'string' || !quoteId) {
    throw new https.HttpsError('invalid-argument', 'Missing required fields');
  }
  const fields = parseQuoteFields(request.data as EditQuoteData);
  const { totalPrice, materialsCost, laborCost, timelineDays, notes } = fields;

  await requireActiveTradie(tradieId);

  // 1. Update the quote (only while it is still 'quoted').
  const quote = await updateOwnQuotedQuote(quoteId, tradieId, 'edited', (tx, ref) => {
    tx.update(ref, { ...fields, updatedAt: FieldValue.serverTimestamp() });
  });

  // 2. Recompute intelligence for the request, and move the rollup's quoted
  //    value by the price change (the nightly reconcile uses current prices).
  const serviceRequestData = await refreshRequestIntelligence(quote.serviceRequestId);
  const priceChange = totalPrice - (quote.totalPrice || 0);
  if (priceChange !== 0) {
    await applyRollupDelta(rollupScope(serviceRequestData), { totalQuotedValue: priceChange });
  }

  // 3. Reflect the new price on the chat quote message + notify customer.
  const roomSnap = await db
    .collection('chatRooms')
    .where('quoteId', '==', quoteId)
    .limit(1)
    .get();

  if (!roomSnap.empty) {
    const roomRef = roomSnap.docs[0].ref;
    const room = roomSnap.docs[0].data();

    const quoteMessages = await roomRef
      .collection('messages')
      .where('type', '==', 'quote')
      .limit(1)
      .get();
    if (!quoteMessages.empty) {
      await quoteMessages.docs[0].ref.update({
        'quoteData.totalPrice': totalPrice,
        'quoteData.materialsCost': materialsCost,
        'quoteData.laborCost': laborCost,
        'quoteData.timelineDays': timelineDays,
        'quoteData.notes': notes,
      });
    }

    await roomRef.collection('messages').add({
      type: 'system',
      text: `${quote.tradieName || 'Tradie'} updated their quote to $${totalPrice.toFixed(2)}`,
      senderId: 'system',
      senderName: 'System',
      receiverId: room.customerId,
      receiverName: room.customerName || 'Customer',
      systemAction: 'quote_updated',
      createdAt: FieldValue.serverTimestamp(),
    });

    await roomRef.update({
      lastMessage: `Updated quote: $${totalPrice.toFixed(2)}`,
      lastMessageType: 'quote',
      lastMessageAt: FieldValue.serverTimestamp(),
      unreadByCustomer: FieldValue.increment(1),
    });
  }

  const customerId = serviceRequestData?.customerId;
  if (customerId) {
    await db.collection('notifications').add({
      userId: customerId,
      title: 'Quote updated',
      message: `${quote.tradieName || 'A tradie'} updated their quote to $${totalPrice.toFixed(2)}.`,
      type: 'quote',
      serviceRequestId: quote.serviceRequestId,
      itemId: quote.serviceRequestId,
      goto: 'requestdetail',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return { success: true, message: 'Quote updated' };
});

/**
 * Callable: withdrawQuote
 * A tradie retracts a submitted (not yet accepted) quote. The quote is marked
 * 'withdrawn', intelligence recomputes, the chat room closes, and the customer
 * is notified. The unlock fee is NOT refunded — the tradie chose to withdraw.
 */
export const withdrawQuote = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { quoteId } = (request.data || {}) as { quoteId: string };
  const tradieId = request.auth.uid;
  if (!quoteId) {
    throw new https.HttpsError('invalid-argument', 'quoteId is required');
  }

  await requireActiveTradie(tradieId);

  // 1. Mark withdrawn (only while it is still 'quoted').
  const quote = await updateOwnQuotedQuote(quoteId, tradieId, 'withdrawn', (tx, ref) => {
    tx.update(ref, { status: 'withdrawn', withdrawnAt: FieldValue.serverTimestamp() });
  });

  // 2. Recompute intelligence (withdrawn quotes are excluded from the 'in' set)
  //    and take the quote out of the rollups, as the nightly reconcile does.
  const reqData = await refreshRequestIntelligence(quote.serviceRequestId);
  await applyRollupDelta(rollupScope(reqData), {
    quoteCount: -1,
    totalQuotedValue: -(quote.totalPrice || 0),
  });

  // 3. Close the chat room + notify customer.
  const roomSnap = await db
    .collection('chatRooms')
    .where('quoteId', '==', quoteId)
    .limit(1)
    .get();
  if (!roomSnap.empty) {
    const roomRef = roomSnap.docs[0].ref;
    const room = roomSnap.docs[0].data();
    await roomRef.update({ quoteStatus: 'rejected', status: 'closed' });
    await roomRef.collection('messages').add({
      type: 'system',
      text: `${quote.tradieName || 'Tradie'} withdrew their quote.`,
      senderId: 'system',
      senderName: 'System',
      receiverId: room.customerId,
      receiverName: room.customerName || 'Customer',
      systemAction: 'quote_withdrawn',
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  const customerId = reqData?.customerId;
  if (customerId) {
    await db.collection('notifications').add({
      userId: customerId,
      title: 'Quote withdrawn',
      message: `${quote.tradieName || 'A tradie'} withdrew their quote for your ${
        reqData?.trades ? reqData.trades.join(', ') : 'service'
      } request.`,
      type: 'quote',
      serviceRequestId: quote.serviceRequestId,
      itemId: quote.serviceRequestId,
      goto: 'requestdetail',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return { success: true, message: 'Quote withdrawn' };
});
