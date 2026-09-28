import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

interface RefundResult {
  refundedCount: number;
  refundedTotal: number;
}

/**
 * Refund the unlock fee to every tradie who unlocked a request but did NOT win
 * it, when the request is cancelled or expires. Idempotent per (tradie + quote):
 * a `refundedAt` marker on the quote prevents double-refunding.
 *
 * @param serviceRequestId  the request being cancelled/expired
 * @param reason            short reason for the transaction description
 * @param excludeTradieId   optional tradie to skip (e.g. the accepted tradie,
 *                          who is not refunded because they won the job)
 */
export async function refundUnlocks(
  serviceRequestId: string,
  reason: string,
  excludeTradieId?: string | null
): Promise<RefundResult> {
  const quotesSnap = await db
    .collection('quotes')
    .where('serviceRequestId', '==', serviceRequestId)
    .get();

  let refundedCount = 0;
  let refundedTotal = 0;

  for (const quoteDoc of quotesSnap.docs) {
    const quote = quoteDoc.data();
    const tradieId = quote.tradieId;

    // Skip: accepted quotes, the excluded tradie, already-refunded quotes, and
    // quotes that were never actually paid for (no unlock amount).
    if (!tradieId) continue;
    if (excludeTradieId && tradieId === excludeTradieId) continue;
    if (quote.status === 'accepted') continue;
    if (quote.refundedAt) continue;

    const unlockAmount = quote.unlockAmount || 0.5;
    if (unlockAmount <= 0) continue;

    const refundRef = `refund_${quoteDoc.id}`;

    // Idempotency guard across retries: skip if a refund txn already exists.
    const dupe = await db
      .collection('walletTransactions')
      .where('userId', '==', tradieId)
      .where('referenceId', '==', refundRef)
      .limit(1)
      .get();
    if (!dupe.empty) continue;

    try {
      const batch = db.batch();

      // 1. Refund transaction record.
      const txnRef = db.collection('walletTransactions').doc();
      batch.set(txnRef, {
        userId: tradieId,
        type: 'refund',
        amount: unlockAmount,
        description: `Unlock refund — ${reason}`,
        referenceId: refundRef,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
      });

      // 2. Credit the wallet.
      batch.update(db.collection('users').doc(tradieId), {
        walletBalance: FieldValue.increment(unlockAmount),
      });

      // 3. Mark the quote as refunded so we never refund it twice.
      batch.update(quoteDoc.ref, {
        refundedAt: FieldValue.serverTimestamp(),
        refundReason: reason,
      });

      // 4. Notify the tradie.
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        userId: tradieId,
        title: 'Unlock refunded',
        message: `$${unlockAmount.toFixed(2)} was refunded to your wallet — ${reason}.`,
        type: 'wallet',
        goto: 'wallet',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();
      refundedCount += 1;
      refundedTotal += unlockAmount;
    } catch (err) {
      console.error(`Failed to refund unlock for tradie ${tradieId} on ${serviceRequestId}:`, err);
    }
  }

  return { refundedCount, refundedTotal };
}
