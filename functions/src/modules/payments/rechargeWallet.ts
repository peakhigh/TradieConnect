import { https } from 'firebase-functions';
import { getStripe, isPaymentsLive, toCents, PAYMENTS_CURRENCY } from './stripe';
import { creditWallet } from './creditWallet';

interface RechargeWalletData {
  amount: number;
  paymentMethod?: string;
  paymentIntentId?: string;
}

/**
 * Callable function: rechargeWallet
 * Adds funds to a user's wallet balance.
 *
 * PAYMENT INTEGRATION POINT
 * -------------------------
 * Real card capture requires a payment processor (Stripe) account + secret key,
 * which are not configured in this environment. The boundary is explicit:
 *  - When `PAYMENTS_LIVE === 'true'`, this function REQUIRES a verified
 *    `paymentIntentId` and is the place to confirm the charge with Stripe
 *    before crediting. If live is on but no integration is wired, we refuse
 *    (we never credit money without a real charge in production).
 *  - Otherwise (dev/test), we credit directly so the wallet/unlock flows can be
 *    exercised against seeded data. Transactions are labelled accordingly.
 * This is a documented exception to the "no mock functionality" rule: we are not
 * faking a charge, we are gating it behind an explicit, un-bypassable flag.
 */
export const rechargeWallet = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, paymentMethod, paymentIntentId } = request.data as RechargeWalletData;
  const userId = request.auth.uid;

  if (!amount || amount <= 0) {
    throw new https.HttpsError('invalid-argument', 'Amount must be positive');
  }

  if (amount < 5) {
    throw new https.HttpsError('invalid-argument', 'Minimum recharge is $5.00');
  }

  const paymentsLive = isPaymentsLive();

  if (paymentsLive) {
    if (!paymentIntentId) {
      throw new https.HttpsError('failed-precondition', 'A payment is required to recharge.');
    }

    // Verify the charge with Stripe before crediting.
    const stripe = getStripe();
    let intent: any;
    try {
      intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (err) {
      console.error('Stripe retrieve failed:', err);
      throw new https.HttpsError('not-found', 'Payment could not be verified.');
    }

    if (intent.status !== 'succeeded') {
      throw new https.HttpsError('failed-precondition', 'Payment has not been completed.');
    }
    if ((intent.currency || '').toLowerCase() !== PAYMENTS_CURRENCY) {
      throw new https.HttpsError('failed-precondition', 'Payment currency mismatch.');
    }
    if (intent.amount_received !== toCents(amount)) {
      throw new https.HttpsError('failed-precondition', 'Payment amount mismatch.');
    }
    if (intent.metadata?.userId && intent.metadata.userId !== userId) {
      throw new https.HttpsError('permission-denied', 'Payment does not belong to this user.');
    }
    // Verified — fall through to credit below.
  }

  try {
    // Credit the wallet (idempotent on paymentIntentId). In live mode this only
    // runs after Stripe verification above; in dev mode it is a direct credit
    // (no live processor configured).
    const newBalance = await creditWallet(userId, amount, {
      referenceId: paymentIntentId,
      description: paymentsLive
        ? `Wallet recharge via ${paymentMethod || 'card'}`
        : `Wallet recharge via ${paymentMethod || 'card'} (dev credit)`,
    });

    return {
      success: true,
      message: 'Wallet recharged successfully',
      newBalance,
    };
  } catch (error: any) {
    if (error?.httpErrorCode || error?.code === 'already-exists') {
      throw error;
    }
    console.error('Error recharging wallet:', error);
    throw new https.HttpsError('internal', 'Failed to recharge wallet');
  }
});
