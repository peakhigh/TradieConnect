import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
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

  if (typeof serviceRequestId !== 'string' || !serviceRequestId) {
    throw new https.HttpsError('invalid-argument', 'serviceRequestId is required');
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new https.HttpsError('invalid-argument', 'Rating must be a whole number from 1 to 5');
  }
  const reviewText = typeof review === 'string' ? review.trim().slice(0, 2000) : '';

  const requestRef = db.collection('serviceRequests').doc(serviceRequestId);
  const customerData = (await db.collection('users').doc(customerId).get()).data();
  const customerName =
    customerData?.displayName ||
    `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim() ||
    'Customer';

  // Everything in one transaction, gated on the request still being
  // 'assigned': a repeat call (double tap, retry, or a scripted loop) can't
  // add the job to the tradie's rating/totalJobs again, write another review
  // or record the earnings twice, and two jobs finishing at once for the same
  // tradie can't lose a rating update.
  const { serviceRequestData, acceptedValue } = await db.runTransaction(async (tx) => {
    const requestDoc = await tx.get(requestRef);
    const req = requestDoc.data();

    // Verify customer owns the service request
    if (!req || req.customerId !== customerId) {
      throw new https.HttpsError('permission-denied', 'Not authorized to complete this request');
    }
    if (req.status !== 'assigned') {
      throw new https.HttpsError(
        'failed-precondition',
        req.status === 'completed'
          ? 'This job is already completed.'
          : 'Only an assigned job can be marked complete.'
      );
    }

    const quoteSnap = req.acceptedQuoteId
      ? await tx.get(db.collection('quotes').doc(req.acceptedQuoteId))
      : (await tx.get(db.collection('quotes')
          .where('serviceRequestId', '==', serviceRequestId)
          .where('status', '==', 'accepted')
          .limit(1))).docs[0];
    const quoteData = quoteSnap?.exists ? quoteSnap.data()! : null;
    const tradieRef = quoteData?.tradieId ? db.collection('users').doc(quoteData.tradieId) : null;
    const tradieData = tradieRef ? (await tx.get(tradieRef)).data() : undefined;

    // Update service request status
    tx.update(requestRef, {
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
      rating,
      review: reviewText,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const jobValue = quoteData?.totalPrice || 0;
    if (!quoteData || !tradieRef) return { serviceRequestData: req, acceptedValue: jobValue };

    // Update tradie's rating and total jobs
    const tradieUpdate: Record<string, any> = {};
    if (tradieData) {
      const currentRating = tradieData.rating || 0;
      const totalJobs = tradieData.totalJobs || 0;
      const newRating = ((currentRating * totalJobs) + rating) / (totalJobs + 1);
      tradieUpdate.rating = Math.round(newRating * 100) / 100;
      tradieUpdate.totalJobs = totalJobs + 1;
    }

    // Persist a per-review record so reviews can be listed on the tradie's
    // profile (the rolling average on the user doc loses the individual text).
    tx.set(db.collection('reviews').doc(), {
      tradieId: quoteData.tradieId,
      customerId,
      customerName,
      serviceRequestId,
      quoteId: quoteSnap!.id,
      trades: req.trades || [],
      rating,
      review: reviewText,
      jobValue,
      createdAt: FieldValue.serverTimestamp(),
    });

    // --- Earnings + platform commission ledger ---
    // On completion the tradie earns the job value less the platform
    // commission. This is the accounting record; actual bank payout via
    // Stripe Connect is a separate, later step. Fixed ids keep it one per job.
    if (jobValue > 0) {
      const tradeDisplay = req.trades ? req.trades.join(', ') : 'service';
      const commission = Math.round(jobValue * COMMISSION_RATE * 100) / 100;
      const netEarning = Math.round((jobValue - commission) * 100) / 100;
      const earningRef = `earning_${serviceRequestId}`;
      const commissionRef = `commission_${serviceRequestId}`;

      // Gross earning credit.
      tx.create(db.collection('walletTransactions').doc(earningRef), {
        userId: quoteData.tradieId,
        type: 'earning',
        amount: jobValue,
        description: `Job earning — ${tradeDisplay}`,
        referenceId: earningRef,
        serviceRequestId,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
      });

      // Platform commission debit.
      tx.create(db.collection('walletTransactions').doc(commissionRef), {
        userId: quoteData.tradieId,
        type: 'commission',
        amount: -commission,
        description: `Platform commission (${Math.round(COMMISSION_RATE * 100)}%) — ${tradeDisplay}`,
        referenceId: commissionRef,
        serviceRequestId,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
      });

      // Track lifetime earnings on the tradie doc for quick dashboard reads.
      tradieUpdate.totalEarnings = FieldValue.increment(netEarning);
      tradieUpdate.totalCommissionPaid = FieldValue.increment(commission);
      tradieUpdate.lifetimeJobValue = FieldValue.increment(jobValue);

      // Record commission as platform revenue.
      tx.create(db.collection('platformRevenue').doc(commissionRef), {
        type: 'commission',
        amount: commission,
        serviceRequestId,
        tradieId: quoteData.tradieId,
        jobValue,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Notify the tradie of their earning.
      tx.set(db.collection('notifications').doc(), {
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
    }

    if (Object.keys(tradieUpdate).length > 0) {
      tx.update(tradieRef, tradieUpdate);
    }
    return { serviceRequestData: req, acceptedValue: jobValue };
  });

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
