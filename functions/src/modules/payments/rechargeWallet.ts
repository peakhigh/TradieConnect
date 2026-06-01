import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

interface RechargeWalletData {
  amount: number;
  paymentMethod: string;
}

/**
 * Callable function: rechargeWallet
 * Adds funds to a user's wallet balance.
 */
export const rechargeWallet = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, paymentMethod } = request.data as RechargeWalletData;
  const userId = request.auth.uid;

  if (!amount || amount <= 0) {
    throw new https.HttpsError('invalid-argument', 'Amount must be positive');
  }

  if (amount < 5) {
    throw new https.HttpsError('invalid-argument', 'Minimum recharge is $5.00');
  }

  try {
    // TODO: Integrate with actual payment processor (Stripe, PayPal, etc.)
    // For now, just add to wallet

    // Create wallet transaction record
    await db.collection('walletTransactions').add({
      userId,
      type: 'recharge',
      amount,
      description: `Wallet recharge via ${paymentMethod || 'card'}`,
      referenceId: '',
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update user's wallet balance
    await db.collection('users').doc(userId).update({
      walletBalance: FieldValue.increment(amount),
    });

    // Get updated balance
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    return {
      success: true,
      message: 'Wallet recharged successfully',
      newBalance: userData?.walletBalance || amount,
    };
  } catch (error) {
    console.error('Error recharging wallet:', error);
    throw new https.HttpsError('internal', 'Failed to recharge wallet');
  }
});
