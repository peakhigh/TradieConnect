import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

interface SendNotificationData {
  userId: string;
  title: string;
  message: string;
  data?: Record<string, string>;
}

/**
 * Callable function: sendPushNotification
 * Sends an FCM push notification to a specific user.
 */
export const sendPushNotification = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, title, message, data: notificationData } = request.data as SendNotificationData;

  if (!userId || !title || !message) {
    throw new https.HttpsError('invalid-argument', 'userId, title, and message are required');
  }

  try {
    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new https.HttpsError('not-found', 'User not found');
    }

    if (userData.fcmToken) {
      const payload: admin.messaging.Message = {
        notification: {
          title,
          body: message,
        },
        data: notificationData || {},
        token: userData.fcmToken,
      };

      await admin.messaging().send(payload);
    }

    // Also create in-app notification record
    await db.collection('notifications').add({
      userId,
      title,
      message,
      type: 'push',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'Notification sent successfully',
    };
  } catch (error: any) {
    // If it's already an HttpsError, rethrow
    if (error?.code) {
      throw error;
    }
    console.error('Error sending notification:', error);
    throw new https.HttpsError('internal', 'Failed to send notification');
  }
});
