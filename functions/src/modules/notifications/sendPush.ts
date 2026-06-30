import { https } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPushToUser } from './push';

const db = admin.firestore();

interface SendNotificationData {
  userId: string;
  title: string;
  message: string;
  data?: Record<string, string>;
}

/**
 * Callable function: sendPushNotification
 * Sends an FCM push notification to a specific user (native + web tokens).
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
    // Delivers to both native (fcmToken) and web (webPushToken) tokens and
    // prunes any that are no longer registered.
    await sendPushToUser(userId, { title, body: message, data: notificationData });

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
