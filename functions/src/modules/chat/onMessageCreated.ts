import { firestore } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

/**
 * Firestore trigger: when a new message is added to a chatRoom,
 * update lastMessage, unread counts, and send push notification.
 */
export const onChatMessageCreated = firestore
  .onDocumentCreated('chatRooms/{chatRoomId}/messages/{messageId}', async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const chatRoomId = event.params.chatRoomId;

    // Skip system messages for unread/push
    if (data.type === 'system' || data.senderId === 'system') return;

    try {
      // Get the chatRoom to determine who to notify
      const chatRoomDoc = await db.collection('chatRooms').doc(chatRoomId).get();
      if (!chatRoomDoc.exists) return;

      const chatRoom = chatRoomDoc.data()!;
      const senderId = data.senderId;

      // Determine who the receiver is
      const isFromTradie = senderId === chatRoom.tradieId;
      const receiverId = isFromTradie ? chatRoom.customerId : chatRoom.tradieId;

      // Update chatRoom: lastMessage + increment unread for receiver
      const updates: Record<string, any> = {
        lastMessage: data.text || 'New message',
        lastMessageAt: FieldValue.serverTimestamp(),
      };

      if (isFromTradie) {
        updates.unreadByCustomer = FieldValue.increment(1);
      } else {
        updates.unreadByTradie = FieldValue.increment(1);
      }

      await db.collection('chatRooms').doc(chatRoomId).update(updates);

      // Send push notification to receiver
      if (receiverId) {
        const receiverDoc = await db.collection('users').doc(receiverId).get();
        const receiverData = receiverDoc.data();

        if (receiverData?.fcmToken) {
          try {
            await admin.messaging().send({
              notification: {
                title: `New message from ${data.senderName || 'Someone'}`,
                body: data.text || 'New message',
              },
              data: {
                type: 'chat_message',
                chatRoomId,
              },
              token: receiverData.fcmToken,
            });
          } catch (pushError: any) {
            // Token might be invalid — don't fail the trigger
            console.log('Push notification failed:', pushError.message);
          }
        }

        // Also create in-app notification
        await db.collection('notifications').add({
          userId: receiverId,
          title: `Message from ${data.senderName || 'Someone'}`,
          message: data.text || 'New message',
          type: 'chat_message',
          referenceId: chatRoomId,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      console.log(`Chat message processed: ${chatRoomId}/${event.params.messageId}`);
    } catch (error) {
      console.error('Error processing chat message:', error);
    }
  });
