import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
  if (!userId) throw new https.HttpsError('invalid-argument', 'userId is required');

  await db.collection('users').doc(userId).update({
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
  await requireAdmin(request);
  const { userId, status } = (request.data || {}) as StatusData;
  if (!userId || !['active', 'suspended'].includes(status)) {
    throw new https.HttpsError('invalid-argument', 'userId and a valid status are required');
  }

  await db.collection('users').doc(userId).update({
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

  // Platform revenue = unlock fees. Sum the (negative) unlock transactions.
  const unlockSnap = await db.collection('walletTransactions')
    .where('type', '==', 'unlock')
    .get();
  let totalUnlocks = 0;
  let unlockRevenue = 0;
  unlockSnap.forEach((d) => {
    totalUnlocks += 1;
    unlockRevenue += Math.abs(d.data().amount || 0);
  });

  return {
    totalUsers: totalUsers.data().count,
    totalCustomers: totalCustomers.data().count,
    totalTradies: totalTradies.data().count,
    pendingApprovals: pendingApprovals.data().count,
    totalUnlocks,
    totalRevenue: Math.round(unlockRevenue * 100) / 100,
  };
});
