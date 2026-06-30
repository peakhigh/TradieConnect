import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { https } from 'firebase-functions';

const db = admin.firestore();

interface CreditOptions {
  referenceId?: string;
  description: string;
}

/**
 * Credit a user's wallet and record the transaction. Idempotent on
 * `referenceId` (e.g. a Stripe PaymentIntent / Checkout Session id): if a
 * transaction with the same reference already exists for the user, it throws
 * `already-exists` so a payment is never credited twice.
 *
 * Returns the user's new wallet balance.
 */
export async function creditWallet(
  userId: string,
  amount: number,
  opts: CreditOptions
): Promise<number> {
  if (opts.referenceId) {
    const dupe = await db
      .collection('walletTransactions')
      .where('userId', '==', userId)
      .where('referenceId', '==', opts.referenceId)
      .limit(1)
      .get();
    if (!dupe.empty) {
      throw new https.HttpsError('already-exists', 'This payment has already been credited.');
    }
  }

  await db.collection('walletTransactions').add({
    userId,
    type: 'recharge',
    amount,
    description: opts.description,
    referenceId: opts.referenceId || '',
    status: 'completed',
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(userId).update({
    walletBalance: FieldValue.increment(amount),
  });

  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.data()?.walletBalance ?? amount;
}
