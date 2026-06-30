import * as admin from 'firebase-admin';

const db = admin.firestore();

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send a push notification to every registered device token for a user.
 *
 * Supports both native (`fcmToken`) and web (`webPushToken`) tokens. Tokens that
 * Firebase reports as unregistered are cleared from the user doc so we stop
 * trying to deliver to dead devices.
 *
 * Returns the number of tokens that were successfully delivered to.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  if (!userData) return 0;

  const targets: { field: 'fcmToken' | 'webPushToken'; token: string }[] = [];
  if (userData.fcmToken) targets.push({ field: 'fcmToken', token: userData.fcmToken });
  if (userData.webPushToken) targets.push({ field: 'webPushToken', token: userData.webPushToken });
  if (targets.length === 0) return 0;

  let delivered = 0;
  const invalidFields: ('fcmToken' | 'webPushToken')[] = [];

  await Promise.all(
    targets.map(async ({ field, token }) => {
      try {
        await admin.messaging().send({
          notification: { title: payload.title, body: payload.body },
          data: payload.data || {},
          token,
        });
        delivered += 1;
      } catch (err: any) {
        const code = err?.code || err?.errorInfo?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          invalidFields.push(field);
        }
        console.log(`Push to ${field} failed:`, err?.message || code);
      }
    })
  );

  if (invalidFields.length > 0) {
    const updates: Record<string, null> = {};
    invalidFields.forEach((f) => {
      updates[f] = null;
    });
    await userRef.update(updates).catch(() => undefined);
  }

  return delivered;
}
