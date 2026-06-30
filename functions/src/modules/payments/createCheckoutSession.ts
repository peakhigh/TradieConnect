import { https } from 'firebase-functions';
import { getStripe, isPaymentsLive, toCents, PAYMENTS_CURRENCY } from './stripe';

interface CreateCheckoutSessionData {
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Callable function: createCheckoutSession
 *
 * Creates a Stripe Checkout Session for a wallet recharge and returns its hosted
 * URL. Used by the web client (redirect to Stripe-hosted checkout — no card UI
 * lives in our app). The session is tagged with the user's uid so
 * confirmCheckoutRecharge can verify ownership before crediting.
 *
 * Only meaningful when `PAYMENTS_LIVE === 'true'`.
 */
export const createCheckoutSession = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!isPaymentsLive()) {
    throw new https.HttpsError(
      'failed-precondition',
      'Live payments are disabled. Recharge runs as a direct dev credit.'
    );
  }

  const { amount, successUrl, cancelUrl } = request.data as CreateCheckoutSessionData;
  const userId = request.auth.uid;

  if (!amount || amount < 5) {
    throw new https.HttpsError('invalid-argument', 'Minimum recharge is $5.00');
  }
  if (!successUrl || !cancelUrl) {
    throw new https.HttpsError('invalid-argument', 'successUrl and cancelUrl are required');
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: PAYMENTS_CURRENCY,
            product_data: { name: 'Wallet recharge' },
            unit_amount: toCents(amount),
          },
          quantity: 1,
        },
      ],
      metadata: { userId, purpose: 'wallet_recharge', amount: String(amount) },
      payment_intent_data: {
        metadata: { userId, purpose: 'wallet_recharge' },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { url: session.url, sessionId: session.id };
  } catch (error: any) {
    if (error?.httpErrorCode) throw error;
    console.error('Error creating checkout session:', error);
    throw new https.HttpsError('internal', 'Could not start checkout.');
  }
});
