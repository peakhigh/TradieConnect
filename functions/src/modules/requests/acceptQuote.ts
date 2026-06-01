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

  // Get quote
  const quoteDoc = await db.collection('quotes').doc(quoteId).get();
  if (!quoteDoc.exists) {
    throw new https.HttpsError('not-found', 'Quote not found');
  }

  const quoteData = quoteDoc.data()!;

  // Verify quote is in 'quoted' status
  if (quoteData.status !== 'quoted') {
    throw new https.HttpsError('failed-precondition', 'Quote is not in a valid state to accept');
  }

  // Verify customer owns the service request
  const serviceRequestDoc = await db.collection('serviceRequests').doc(quoteData.serviceRequestId).get();
  const serviceRequestData = serviceRequestDoc.data();

  if (!serviceRequestData || serviceRequestData.customerId !== customerId) {
    throw new https.HttpsError('permission-denied', 'Not authorized to accept this quote');
  }

  // 1. Update winning quote: status → 'accepted'
  await db.collection('quotes').doc(quoteId).update({
    status: 'accepted',
    acceptedAt: FieldValue.serverTimestamp(),
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

  // 3. Update serviceRequest status to 'assigned'
  await db.collection('serviceRequests').doc(quoteData.serviceRequestId).update({
    status: 'assigned',
    acceptedQuoteId: quoteId,
    customerAddress: customerAddress || null,
    customerPhone: customerPhone || null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 4. Notify accepted tradie
  await db.collection('notifications').add({
    userId: quoteData.tradieId,
    title: 'Quote Accepted!',
    message: `Your $${quoteData.totalPrice?.toFixed(2)} quote has been accepted. Customer details shared.`,
    type: 'quote_accepted',
    quoteId,
    serviceRequestId: quoteData.serviceRequestId,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 5. Notify rejected tradies
  const rejectedDocs = otherQuotes.docs.filter(doc => doc.id !== quoteId);
  for (const rejectedDoc of rejectedDocs) {
    const rejectedData = rejectedDoc.data();
    await db.collection('notifications').add({
      userId: rejectedData.tradieId,
      title: 'Quote Not Selected',
      message: `Another tradie was selected for the ${serviceRequestData.trades ? serviceRequestData.trades.join(', ') : 'service'} request.`,
      type: 'quote_rejected',
      quoteId: rejectedDoc.id,
      serviceRequestId: quoteData.serviceRequestId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return {
    success: true,
    message: 'Quote accepted successfully',
  };
});
