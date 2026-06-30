/**
 * Stripe integration boundary.
 *
 * Live payments are gated behind `PAYMENTS_LIVE === 'true'`. When live, a real
 * Stripe secret key (`STRIPE_SECRET_KEY`) MUST be configured — we never credit a
 * wallet without a verified charge. When not live, the wallet/unlock flows are
 * exercised with a direct dev credit (see rechargeWallet).
 *
 * The `stripe` package is loaded lazily via require() so functions that don't
 * touch payments don't pay the import cost, and so the module is only required
 * when live payments are actually configured.
 */
import { https } from 'firebase-functions';

export const PAYMENTS_CURRENCY = 'aud';

export const isPaymentsLive = (): boolean => process.env.PAYMENTS_LIVE === 'true';

/**
 * Returns true when live payments are enabled AND a secret key is present.
 * Used to decide whether the real Stripe path must run.
 */
export const isStripeConfigured = (): boolean =>
  isPaymentsLive() && !!process.env.STRIPE_SECRET_KEY;

let cachedClient: any = null;

/**
 * Lazily construct (and cache) the Stripe client. Throws an HttpsError if live
 * payments are enabled but no secret key is configured — we refuse to proceed
 * rather than silently fall back to a fake charge.
 */
export const getStripe = (): any => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new https.HttpsError(
      'failed-precondition',
      'Live payments are enabled but STRIPE_SECRET_KEY is not configured.'
    );
  }
  if (!cachedClient) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    cachedClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }
  return cachedClient;
};

/** Convert a dollar amount to integer cents for Stripe. */
export const toCents = (amount: number): number => Math.round(amount * 100);
