import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AggregateField, FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

/** Throws unless the caller is an authenticated admin user. */
async function requireAdmin(request: any): Promise<string> {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const uid = request.auth.uid;
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists || snap.data()?.userType !== 'admin') {
    throw new https.HttpsError('permission-denied', 'Admin access required');
  }
  return uid;
}

interface ApprovalData {
  userId: string;
  approved: boolean;
}

/**
 * adminSetTradieApproval — approve or un-approve a tradie. Admin only.
 */
export const adminSetTradieApproval = https.onCall(async (request) => {
  const adminUid = await requireAdmin(request);
  const { userId, approved } = (request.data || {}) as ApprovalData;
  if (typeof userId !== 'string' || !userId) throw new https.HttpsError('invalid-argument', 'userId is required');

  const target = await db.collection('users').doc(userId).get();
  if (!target.exists || target.data()?.userType !== 'tradie') {
    throw new https.HttpsError('not-found', 'Tradie not found');
  }

  await target.ref.update({
    isApproved: !!approved,
    approvedAt: approved ? FieldValue.serverTimestamp() : null,
    approvedBy: approved ? adminUid : null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, message: approved ? 'Tradie approved' : 'Approval revoked' };
});

interface StatusData {
  userId: string;
  status: 'active' | 'suspended';
}

/**
 * adminSetUserStatus — suspend or reactivate any user. Admin only.
 */
export const adminSetUserStatus = https.onCall(async (request) => {
  const adminUid = await requireAdmin(request);
  const { userId, status } = (request.data || {}) as StatusData;
  if (typeof userId !== 'string' || !userId || !['active', 'suspended'].includes(status)) {
    throw new https.HttpsError('invalid-argument', 'userId and a valid status are required');
  }
  // An admin suspending themselves could lock the platform out of admin.
  if (userId === adminUid) {
    throw new https.HttpsError('failed-precondition', "You can't change your own account status");
  }

  const target = await db.collection('users').doc(userId).get();
  if (!target.exists) {
    throw new https.HttpsError('not-found', 'User not found');
  }

  await target.ref.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Disable/enable the Auth account to actually block access.
  try {
    await admin.auth().updateUser(userId, { disabled: status === 'suspended' });
    if (status === 'suspended') await admin.auth().revokeRefreshTokens(userId);
  } catch (e: any) {
    console.log('Auth status update skipped:', e?.message);
  }

  return { success: true, message: status === 'suspended' ? 'User suspended' : 'User reactivated' };
});

/**
 * getAdminStats — platform totals computed server-side from real data.
 * Admin only. Uses count() aggregations + a bounded transaction scan.
 */
export const getAdminStats = https.onCall(async (request) => {
  await requireAdmin(request);

  const usersCol = db.collection('users');
  const [totalUsers, totalCustomers, totalTradies, pendingApprovals] = await Promise.all([
    usersCol.count().get(),
    usersCol.where('userType', '==', 'customer').count().get(),
    usersCol.where('userType', '==', 'tradie').count().get(),
    usersCol.where('userType', '==', 'tradie').where('isApproved', '==', false).count().get(),
  ]);

  // Revenue via server-side aggregations: the cost stays flat no matter how
  // many transactions exist (the old scan read every unlock and commission
  // doc on each dashboard load).
  // Unlock fees are negative 'unlock' transactions; refunded unlocks (the only
  // 'refund' type, from refundUnlocks) aren't revenue.
  const txns = db.collection('walletTransactions');
  const [unlockAgg, refundAgg, commissionAgg] = await Promise.all([
    txns.where('type', '==', 'unlock')
      .aggregate({ count: AggregateField.count(), total: AggregateField.sum('amount') }).get(),
    txns.where('type', '==', 'refund')
      .aggregate({ total: AggregateField.sum('amount') }).get(),
    // Commission revenue = 5% taken from completed jobs (platformRevenue ledger).
    db.collection('platformRevenue').where('type', '==', 'commission')
      .aggregate({ total: AggregateField.sum('amount') }).get(),
  ]);

  const totalUnlocks = unlockAgg.data().count;
  const unlockRevenue =
    Math.round((Math.abs(unlockAgg.data().total || 0) - (refundAgg.data().total || 0)) * 100) / 100;
  const commissionRevenue = Math.round((commissionAgg.data().total || 0) * 100) / 100;

  return {
    totalUsers: totalUsers.data().count,
    totalCustomers: totalCustomers.data().count,
    totalTradies: totalTradies.data().count,
    pendingApprovals: pendingApprovals.data().count,
    totalUnlocks,
    unlockRevenue,
    commissionRevenue,
    totalRevenue: Math.round((unlockRevenue + commissionRevenue) * 100) / 100,
  };
});
