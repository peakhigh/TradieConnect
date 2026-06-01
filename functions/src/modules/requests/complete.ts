import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

interface CompleteServiceData {
  serviceRequestId: string;
  rating: number;
  review: string;
}

/**
 * Callable function: completeServiceRequest
 * Customer marks a job as completed and rates the tradie.
 */
export const completeServiceRequest = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { serviceRequestId, rating, review } = request.data as CompleteServiceData;
  const customerId = request.auth.uid;

  if (!serviceRequestId) {
    throw new https.HttpsError('invalid-argument', 'serviceRequestId is required');
  }

  // Verify customer owns the service request
  const serviceRequestDoc = await db.collection('serviceRequests').doc(serviceRequestId).get();
  const serviceRequestData = serviceRequestDoc.data();

  if (!serviceRequestData || serviceRequestData.customerId !== customerId) {
    throw new https.HttpsError('permission-denied', 'Not authorized to complete this request');
  }

  // Update service request status
  await db.collection('serviceRequests').doc(serviceRequestId).update({
    status: 'completed',
    completedAt: FieldValue.serverTimestamp(),
    rating,
    review,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Update tradie's rating and total jobs
  const quoteQuery = await db.collection('quotes')
    .where('serviceRequestId', '==', serviceRequestId)
    .where('status', '==', 'accepted')
    .limit(1)
    .get();

  if (!quoteQuery.empty) {
    const quoteData = quoteQuery.docs[0].data();
    const tradieRef = db.collection('users').doc(quoteData.tradieId);
    const tradieDoc = await tradieRef.get();
    const tradieData = tradieDoc.data();

    if (tradieData) {
      const currentRating = tradieData.rating || 0;
      const totalJobs = tradieData.totalJobs || 0;
      const newRating = ((currentRating * totalJobs) + rating) / (totalJobs + 1);

      await tradieRef.update({
        rating: Math.round(newRating * 100) / 100,
        totalJobs: totalJobs + 1,
      });
    }
  }

  return {
    success: true,
    message: 'Service request completed successfully',
  };
});
