import { https } from 'firebase-functions';
import { getStripe, isPaymentsLive, PAYMENTS_CURRENCY } from './stripe';
import { creditWallet } from './creditWallet';

/**
 * HTTP function: stripeWebhook
 *
 * Server-side backstop for wallet recharges. Stripe calls this endpoint
 * directly, so credits land even if the user closes the tab before returning
 * from Checkout (or the native app is killed after PaymentSheet succeeds).
 *
 * Security:
 *  - Verifies the Stripe signature using STRIPE_WEBHOOK_SECRET (raw body).
 *  - Reads userId + amount from Stripe objects, never from the request body
 *    directly beyond what Stripe signed.
 *
 * Idempotency:
 *  - creditWallet dedups on the PaymentIntent id, so this and the client-side
 *    confirmation can both fire safely — only one credit is applied.
 *
 * Handled events:
 *  - checkout.session.completed (web hosted Checkout)
 *  - payment_intent.succeeded   (native PaymentSheet)
 */
export const stripeWebhook = https.onRequest(async (req, res) => {
  if (!isPaymentsLive()) {
    res.status(404).send('Payments are not live.');
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured.');
    res.status(500).send('Webhook not configured.');
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    res.status(400).send('Missing signature.');
    return;
  }

  const stripe = getStripe();
  let event: any;
  try {
    // rawBody is provided by the Functions runtime and is required for
    // signature verification (the parsed body would fail the check).
    event = stripe.webhooks.constructEvent((req as any).rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message);
    res.status(400).send(`Webhook Error: ${err?.message}`);
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (
        session.payment_status === 'paid' &&
        session.metadata?.purpose === 'wallet_recharge'
      ) {
        await creditFromCheckout(session);
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      if (intent.metadata?.purpose === 'wallet_recharge') {
        await creditFromPaymentIntent(intent);
      }
    }
    res.status(200).send('ok');
  } catch (err: any) {
    // Already credited (idempotent) — acknowledge so Stripe stops retrying.
    if (err?.code === 'already-exists') {
      res.status(200).send('already credited');
      return;
    }
    console.error('Webhook handler error:', err);
    res.status(500).send('Handler error');
  }
});

async function creditFromCheckout(session: any): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) return;
  if ((session.currency || '').toLowerCase() !== PAYMENTS_CURRENCY) return;
  const amount = (session.amount_total || 0) / 100;
  if (amount <= 0) return;
  const referenceId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || session.id;

  await creditWallet(userId, amount, {
    referenceId,
    description: 'Wallet recharge via card',
  });
}

async function creditFromPaymentIntent(intent: any): Promise<void> {
  const userId = intent.metadata?.userId;
  if (!userId) return;
  if ((intent.currency || '').toLowerCase() !== PAYMENTS_CURRENCY) return;
  const amount = (intent.amount_received || 0) / 100;
  if (amount <= 0) return;

  await creditWallet(userId, amount, {
    referenceId: intent.id,
    description: 'Wallet recharge via card',
  });
}
