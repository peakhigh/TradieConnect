import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { applyRollupDelta } from '../reporting/rollups';

const db = admin.firestore();

// Platform commission taken from each completed job's value (mirrors
// appConfig.pricing.commissionRate = 0.05). Kept here as the server source of
// truth since Cloud Functions can't import the client appConfig.
const COMMISSION_RATE = 0.05;

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

  let acceptedValue = 0;
  if (!quoteQuery.empty) {
    const quoteData = quoteQuery.docs[0].data();
    acceptedValue = quoteData.totalPrice || 0;
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

    // Persist a per-review record so reviews can be listed on the tradie's
    // profile (the rolling average on the user doc loses the individual text).
    if (typeof rating === 'number' && rating > 0) {
      const customerDoc = await db.collection('users').doc(customerId).get();
      const customerData = customerDoc.data();
      const customerName =
        customerData?.displayName ||
        `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim() ||
        'Customer';

      await db.collection('reviews').add({
        tradieId: quoteData.tradieId,
        customerId,
        customerName,
        serviceRequestId,
        quoteId: quoteQuery.docs[0].id,
        trades: serviceRequestData.trades || [],
        rating,
        review: review || '',
        jobValue: acceptedValue,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // --- Earnings + platform commission ledger ---
    // On completion the tradie earns the job value less the platform
    // commission. We record this as an earnings ledger (idempotent per job so
    // re-completing can't double-credit). This is the accounting record; actual
    // bank payout via Stripe Connect is a separate, later step.
    if (acceptedValue > 0 && quoteData.tradieId) {
      const tradeDisplay = serviceRequestData.trades
        ? serviceRequestData.trades.join(', ')
        : 'service';
      const commission = Math.round(acceptedValue * COMMISSION_RATE * 100) / 100;
      const netEarning = Math.round((acceptedValue - commission) * 100) / 100;
      const earningRef = `earning_${serviceRequestId}`;

      // Idempotency guard: skip if we've already recorded earnings for this job.
      const existingEarning = await db
        .collection('walletTransactions')
        .where('userId', '==', quoteData.tradieId)
        .where('referenceId', '==', earningRef)
        .limit(1)
        .get();

      if (existingEarning.empty) {
        const batch = db.batch();

        // Gross earning credit.
        batch.set(db.collection('walletTransactions').doc(), {
          userId: quoteData.tradieId,
          type: 'earning',
          amount: acceptedValue,
          description: `Job earning — ${tradeDisplay}`,
          referenceId: earningRef,
          serviceRequestId,
          status: 'completed',
          createdAt: FieldValue.serverTimestamp(),
        });

        // Platform commission debit.
        batch.set(db.collection('walletTransactions').doc(), {
          userId: quoteData.tradieId,
          type: 'commission',
          amount: -commission,
          description: `Platform commission (${Math.round(COMMISSION_RATE * 100)}%) — ${tradeDisplay}`,
          referenceId: `commission_${serviceRequestId}`,
          serviceRequestId,
          status: 'completed',
          createdAt: FieldValue.serverTimestamp(),
        });

        // Track lifetime earnings on the tradie doc for quick dashboard reads.
        batch.update(db.collection('users').doc(quoteData.tradieId), {
          totalEarnings: FieldValue.increment(netEarning),
          totalCommissionPaid: FieldValue.increment(commission),
          lifetimeJobValue: FieldValue.increment(acceptedValue),
        });

        // Record commission as platform revenue.
        batch.set(db.collection('platformRevenue').doc(), {
          type: 'commission',
          amount: commission,
          serviceRequestId,
          tradieId: quoteData.tradieId,
          jobValue: acceptedValue,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Notify the tradie of their earning.
        batch.set(db.collection('notifications').doc(), {
          userId: quoteData.tradieId,
          title: 'Payment recorded',
          message: `You earned $${netEarning.toFixed(2)} for the ${tradeDisplay} job (after ${Math.round(
            COMMISSION_RATE * 100
          )}% commission).`,
          type: 'wallet',
          goto: 'wallet',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();
      }
    }
  }

  // Reporting rollups: job completed — record completion + accepted value,
  // and remove it from the active count.
  await applyRollupDelta(
    {
      suburb: serviceRequestData.suburb,
      postcode: serviceRequestData.postcode,
      state: serviceRequestData.state,
      trades: serviceRequestData.trades || [],
    },
    { completedCount: 1, acceptedValue, activeRequestCount: -1 }
  );

  return {
    success: true,
    message: 'Service request completed successfully',
  };
});
