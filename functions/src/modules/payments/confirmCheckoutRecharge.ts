import { https } from 'firebase-functions';
import { getStripe, isPaymentsLive, PAYMENTS_CURRENCY } from './stripe';
import { creditWallet } from './creditWallet';

interface ConfirmCheckoutData {
  sessionId: string;
}

/**
 * Callable function: confirmCheckoutRecharge
 *
 * Completes a web Checkout recharge after the user returns from Stripe-hosted
 * checkout. Retrieves the session, verifies it was paid and belongs to the
 * caller, then credits the wallet (idempotent on the PaymentIntent id).
 *
 * This is the server-side confirmation for the web flow. It does not trust the
 * client beyond the session id — amount and ownership come from Stripe.
 */
export const confirmCheckoutRecharge = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!isPaymentsLive()) {
    throw new https.HttpsError('failed-precondition', 'Live payments are disabled.');
  }

  const { sessionId } = request.data as ConfirmCheckoutData;
  const userId = request.auth.uid;

  if (!sessionId) {
    throw new https.HttpsError('invalid-argument', 'sessionId is required');
  }

  const stripe = getStripe();
  let session: any;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
  } catch (err) {
    console.error('Stripe session retrieve failed:', err);
    throw new https.HttpsError('not-found', 'Payment could not be verified.');
  }

  if (session.payment_status !== 'paid') {
    throw new https.HttpsError('failed-precondition', 'Payment has not been completed.');
  }
  if (session.metadata?.userId !== userId) {
    throw new https.HttpsError('permission-denied', 'Payment does not belong to this user.');
  }
  if ((session.currency || '').toLowerCase() !== PAYMENTS_CURRENCY) {
    throw new https.HttpsError('failed-precondition', 'Payment currency mismatch.');
  }

  const amountTotal = (session.amount_total || 0) / 100;
  if (amountTotal <= 0) {
    throw new https.HttpsError('failed-precondition', 'Invalid payment amount.');
  }

  const intent = session.payment_intent;
  const referenceId = typeof intent === 'string' ? intent : intent?.id || session.id;

  try {
    const newBalance = await creditWallet(userId, amountTotal, {
      referenceId,
      description: 'Wallet recharge via card',
    });
    return { success: true, message: 'Wallet recharged successfully', newBalance };
  } catch (error: any) {
    if (error?.httpErrorCode || error?.code === 'already-exists') throw error;
    console.error('Error crediting wallet from checkout:', error);
    throw new https.HttpsError('internal', 'Failed to credit wallet.');
  }
});
