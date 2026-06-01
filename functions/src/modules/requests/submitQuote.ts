import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { recalculateIntelligence } from './intelligence';

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

  if (!serviceRequestId || !totalPrice || !timelineDays) {
    throw new https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // 1. Find existing quotes doc where tradieId == auth.uid AND serviceRequestId AND status == 'unlocked'
  const unlockQuery = await db.collection('quotes')
    .where('tradieId', '==', tradieId)
    .where('serviceRequestId', '==', serviceRequestId)
    .where('status', '==', 'unlocked')
    .limit(1)
    .get();

  if (unlockQuery.empty) {
    throw new https.HttpsError(
      'permission-denied',
      'You must unlock this request before submitting a quote. No unlocked entry found.'
    );
  }

  const quoteDocRef = unlockQuery.docs[0].ref;

  // 2. Update that doc: status → 'quoted', fill in all pricing fields
  await quoteDocRef.update({
    status: 'quoted',
    totalPrice,
    materialsCost,
    laborCost,
    timelineDays,
    estimatedStartDate: estimatedStartDate ? Timestamp.fromDate(new Date(estimatedStartDate)) : null,
    estimatedCompletionDate: estimatedCompletionDate ? Timestamp.fromDate(new Date(estimatedCompletionDate)) : null,
    notes: notes || null,
    quotedAt: FieldValue.serverTimestamp(),
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
  });

  // 7. Create notification for customer
  if (serviceRequestData?.customerId) {
    await db.collection('notifications').add({
      userId: serviceRequestData.customerId,
      title: 'New Quote Received',
      message: `You received a $${totalPrice.toFixed(2)} quote for your ${serviceRequestData.trades ? serviceRequestData.trades.join(', ') : 'service'} request`,
      type: 'quote',
      serviceRequestId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return {
    success: true,
    message: 'Quote submitted successfully',
  };
});
