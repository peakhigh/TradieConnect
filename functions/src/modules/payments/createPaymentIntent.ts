import { https } from 'firebase-functions';
import { getStripe, isPaymentsLive, toCents, PAYMENTS_CURRENCY } from './stripe';

interface CreatePaymentIntentData {
  amount: number;
}

/**
 * Callable function: createPaymentIntent
 *
 * Creates a Stripe PaymentIntent for a wallet recharge and returns its
 * clientSecret so the client can confirm the card payment. The intent is tagged
 * with the authenticated user's uid in metadata so rechargeWallet can verify
 * ownership before crediting.
 *
 * Only meaningful when `PAYMENTS_LIVE === 'true'`. In dev (flag off) there is no
 * card capture — the client credits directly via rechargeWallet — so calling
 * this is rejected to avoid implying a real charge path exists.
 */
export const createPaymentIntent = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!isPaymentsLive()) {
    throw new https.HttpsError(
      'failed-precondition',
      'Live payments are disabled. Recharge runs as a direct dev credit.'
    );
  }

  const { amount } = request.data as CreatePaymentIntentData;
  const userId = request.auth.uid;

  if (!amount || amount <= 0) {
    throw new https.HttpsError('invalid-argument', 'Amount must be positive');
  }
  if (amount < 5) {
    throw new https.HttpsError('invalid-argument', 'Minimum recharge is $5.00');
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: toCents(amount),
      currency: PAYMENTS_CURRENCY,
      metadata: { userId, purpose: 'wallet_recharge' },
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      publishableKeyHint: 'Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY on the client',
    };
  } catch (error: any) {
    if (error?.code && typeof error.code === 'string' && error.httpErrorCode) {
      // Already an HttpsError
      throw error;
    }
    console.error('Error creating payment intent:', error);
    throw new https.HttpsError('internal', 'Could not start the payment.');
  }
});
