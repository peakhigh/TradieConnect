/**
 * Wallet recharge orchestration.
 *
 * Gated by EXPO_PUBLIC_PAYMENTS_LIVE:
 *   - 'false'/unset (default) → dev credit: calls rechargeWallet directly. No
 *     real charge (matches the backend's dev path). Lets wallet/unlock flows be
 *     exercised against seeded data.
 *   - 'true' → real Stripe charge before crediting:
 *       • Web    → redirect to Stripe-hosted Checkout (no card UI in our app).
 *                  On return, completeWebCheckoutIfReturning() credits the wallet.
 *       • Native → Stripe PaymentSheet (@stripe/stripe-react-native) using a
 *                  PaymentIntent, then rechargeWallet verifies + credits.
 *
 * Requires EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY when live.
 */
import { Platform } from 'react-native';
import { runCloudFunction } from './cloudFunctions';

export const paymentsLive = (): boolean => process.env.EXPO_PUBLIC_PAYMENTS_LIVE === 'true';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export interface RechargeResult {
  /** true when the wallet was credited in this call (dev + native live). */
  credited: boolean;
  /** true when we redirected the browser to Checkout (web live). */
  redirecting?: boolean;
  /** true when the user cancelled the native PaymentSheet. */
  cancelled?: boolean;
  newBalance?: number;
}

/**
 * Start (and where possible complete) a wallet recharge for `amount` dollars.
 */
export async function rechargeWalletFlow(amount: number): Promise<RechargeResult> {
  if (!paymentsLive()) {
    const res = await runCloudFunction<{ newBalance?: number }>('rechargeWallet', { amount });
    return { credited: true, newBalance: res?.newBalance };
  }

  if (!PUBLISHABLE_KEY) {
    throw new Error('Payments are enabled but EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.');
  }

  if (Platform.OS === 'web') {
    return startWebCheckout(amount);
  }
  return payWithPaymentSheet(amount);
}

/* ------------------------------- Web (Checkout) ------------------------------ */

async function startWebCheckout(amount: number): Promise<RechargeResult> {
  const origin = window.location.origin;
  const path = window.location.pathname;
  // Stripe substitutes {CHECKOUT_SESSION_ID} into the success URL.
  const successUrl = `${origin}${path}?recharge_session={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}${path}?recharge_cancelled=1`;

  const { url } = await runCloudFunction<{ url: string; sessionId: string }>(
    'createCheckoutSession',
    { amount, successUrl, cancelUrl }
  );
  if (!url) throw new Error('Could not start checkout.');
  window.location.href = url;
  return { credited: false, redirecting: true };
}

/**
 * On web, if we've just returned from Stripe Checkout (URL has
 * `recharge_session`), confirm + credit and clean the URL. Returns the new
 * balance when a credit happened, otherwise null. Safe to call on every mount.
 */
export async function completeWebCheckoutIfReturning(): Promise<number | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('recharge_session');
  const cancelled = params.get('recharge_cancelled');

  if (!sessionId && !cancelled) return null;

  // Clean the query string regardless of outcome.
  const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
  window.history.replaceState({}, document.title, cleanUrl);

  if (!sessionId) return null; // cancelled

  const res = await runCloudFunction<{ newBalance?: number }>('confirmCheckoutRecharge', {
    sessionId,
  });
  return res?.newBalance ?? null;
}

/* ------------------------------ Native (PaymentSheet) ------------------------ */

async function payWithPaymentSheet(amount: number): Promise<RechargeResult> {
  // Variable specifier so TypeScript/bundler don't hard-require the native-only
  // package on platforms/builds where it isn't installed.
  const moduleName = '@stripe/stripe-react-native';
  let stripeRN: any;
  try {
    stripeRN = await import(moduleName);
  } catch {
    throw new Error('Stripe native SDK is not installed. Add @stripe/stripe-react-native.');
  }

  const { initStripe, initPaymentSheet, presentPaymentSheet } = stripeRN;
  await initStripe({ publishableKey: PUBLISHABLE_KEY });

  const { clientSecret, paymentIntentId } = await runCloudFunction<{
    clientSecret: string;
    paymentIntentId: string;
  }>('createPaymentIntent', { amount });

  const initRes = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'TradieConnect',
  });
  if (initRes?.error) throw new Error(initRes.error.message || 'Could not initialise payment.');

  const sheetRes = await presentPaymentSheet();
  if (sheetRes?.error) {
    if (sheetRes.error.code === 'Canceled') return { credited: false, cancelled: true };
    throw new Error(sheetRes.error.message || 'Payment failed.');
  }

  // Payment succeeded — verify + credit server-side.
  const res = await runCloudFunction<{ newBalance?: number }>('rechargeWallet', {
    amount,
    paymentIntentId,
  });
  return { credited: true, newBalance: res?.newBalance };
}
