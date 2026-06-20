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
        lastMessageType: data.type || 'text',
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
                goto: 'chatscreen',
                itemId: chatRoomId,
              },
              token: receiverData.fcmToken,
            });
          } catch (pushError: any) {
            // Token might be invalid — clear it so we stop trying.
            if (pushError?.code === 'messaging/registration-token-not-registered') {
              await db.collection('users').doc(receiverId).update({ fcmToken: null });
            }
            console.log('Push notification failed:', pushError.message);
          }
        }

        // Create/refresh an in-app notification — deduped per (userId + type + itemId)
        // while still unread, so we don't spam the feed for the same room.
        const existing = await db.collection('notifications')
          .where('userId', '==', receiverId)
          .where('type', '==', 'chat_message')
          .where('itemId', '==', chatRoomId)
          .where('read', '==', false)
          .limit(1)
          .get();

        if (existing.empty) {
          await db.collection('notifications').add({
            userId: receiverId,
            title: `Message from ${data.senderName || 'Someone'}`,
            message: data.text || 'New message',
            type: 'chat_message',
            itemId: chatRoomId,
            referenceId: chatRoomId,
            goto: 'chatscreen',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        } else {
          // Refresh preview + timestamp on the existing unread notification.
          await existing.docs[0].ref.update({
            message: data.text || 'New message',
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }

      console.log(`Chat message processed: ${chatRoomId}/${event.params.messageId}`);
    } catch (error) {
      console.error('Error processing chat message:', error);
    }
  });
