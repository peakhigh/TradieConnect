import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

const SIGNUP_BONUS = 10; // AUD — see project business model

// The onboarding fields a tradie may set (OnboardingSuccessStep). This runs
// with the Admin SDK, which bypasses the users rules, so anything else
// (isApproved, status, phoneNumber, earnings…) must never be copied across.
const PROFILE_FIELDS = [
  'firstName', 'lastName', 'email', 'businessType', 'abn', 'businessName',
  'businessAddress', 'licenceDetails', 'insuranceDetails',
  'interestedSuburbs', 'interestedTrades',
];

interface CompleteOnboardingData {
  profile: Record<string, any>;
}

/**
 * Callable: completeOnboarding
 * Persists the tradie's onboarding profile, marks onboardingCompleted, and
 * credits the one-time $10 signup bonus (idempotent — guarded by
 * `signupBonusGranted` so re-runs never double-credit).
 *
 * Money + the completion flag are handled server-side so they can't be forged
 * by the client.
 */
export const completeOnboarding = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const uid = request.auth.uid;
  const { profile } = (request.data || {}) as CompleteOnboardingData;

  const userRef = db.collection('users').doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) {
      throw new https.HttpsError('not-found', 'User not found');
    }
    const data = snap.data() || {};

    // Only tradies onboard (and get the signup bonus).
    if (data.userType !== 'tradie') {
      throw new https.HttpsError('permission-denied', 'Only tradies can complete onboarding');
    }

    // Copy only the onboarding fields; the client can't set balance, role,
    // approval, bonus flags or reputation through this call.
    const input = profile && typeof profile === 'object' ? profile : {};
    const safeProfile = Object.fromEntries(
      PROFILE_FIELDS.filter((key) => input[key] !== undefined).map((key) => [key, input[key]])
    );

    const alreadyGranted = data.signupBonusGranted === true;

    const update: Record<string, any> = {
      ...safeProfile,
      onboardingCompleted: true,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!alreadyGranted) {
      update.walletBalance = FieldValue.increment(SIGNUP_BONUS);
      update.signupBonusGranted = true;
    }

    tx.update(userRef, update);

    if (!alreadyGranted) {
      const txnRef = db.collection('walletTransactions').doc();
      tx.set(txnRef, {
        userId: uid,
        type: 'bonus',
        amount: SIGNUP_BONUS,
        description: 'Signup bonus',
        referenceId: '',
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return { bonusGranted: !alreadyGranted };
  });

  return {
    success: true,
    message: result.bonusGranted
      ? `Onboarding complete — $${SIGNUP_BONUS} signup bonus credited!`
      : 'Onboarding complete.',
    bonusGranted: result.bonusGranted,
  };
});
