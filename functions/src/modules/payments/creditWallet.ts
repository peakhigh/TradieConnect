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
  // The Stripe webhook and confirmCheckoutRecharge both credit the same payment,
  // usually at the same moment. A fixed doc id per payment, created inside a
  // transaction, makes the second credit fail instead of doubling the money.
  const txnRef = opts.referenceId
    ? db.collection('walletTransactions').doc(`recharge_${opts.referenceId}`)
    : db.collection('walletTransactions').doc();
  const userRef = db.collection('users').doc(userId);

  await db.runTransaction(async (tx) => {
    if (opts.referenceId) {
      const [existing, legacyDupe] = await Promise.all([
        tx.get(txnRef),
        // Credits recorded before fixed ids were used.
        tx.get(db.collection('walletTransactions')
          .where('userId', '==', userId)
          .where('referenceId', '==', opts.referenceId)
          .limit(1)),
      ]);
      if (existing.exists || !legacyDupe.empty) {
        throw new https.HttpsError('already-exists', 'This payment has already been credited.');
      }
    }

    tx.create(txnRef, {
      userId,
      type: 'recharge',
      amount,
      description: opts.description,
      referenceId: opts.referenceId || '',
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(userRef, { walletBalance: FieldValue.increment(amount) });
  });

  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.data()?.walletBalance ?? amount;
}
