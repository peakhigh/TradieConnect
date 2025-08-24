import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// Unlock service request for tradie
export const unlockServiceRequest = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { serviceRequestId } = data;
  const tradieId = context.auth.uid;

  try {
    // Get tradie's wallet balance
    const tradieDoc = await db.collection('users').doc(tradieId).get();
    if (!tradieDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Tradie not found');
    }

    const tradieData = tradieDoc.data();
    if (tradieData?.userType !== 'tradie') {
      throw new functions.https.HttpsError('permission-denied', 'Only tradies can unlock requests');
    }

    const unlockCost = 0.50;
    if ((tradieData.walletBalance || 0) < unlockCost) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient wallet balance');
    }

    // Get service request
    const serviceRequestDoc = await db.collection('serviceRequests').doc(serviceRequestId).get();
    if (!serviceRequestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Service request not found');
    }

    const serviceRequestData = serviceRequestDoc.data();
    if (serviceRequestData?.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', 'Service request is not active');
    }

    // Deduct from wallet
    await db.collection('users').doc(tradieId).update({
      walletBalance: admin.firestore.FieldValue.increment(-unlockCost)
    });

    // Create unlock transaction record
    await db.collection('unlockTransactions').add({
      tradieId,
      serviceRequestId,
      amount: unlockCost,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    // Create wallet transaction record
    await db.collection('walletTransactions').add({
      userId: tradieId,
      type: 'unlock',
      amount: -unlockCost,
      description: `Unlocked service request: ${serviceRequestData.tradeType}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    return {
      success: true,
      message: 'Service request unlocked successfully',
      unlockCost
    };
  } catch (error) {
    console.error('Error unlocking service request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to unlock service request');
  }
});

// Submit quote for service request
export const submitQuote = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { serviceRequestId, amount, breakdown, estimatedStartDate, estimatedCompletionDate, notes } = data;
  const tradieId = context.auth.uid;

  try {
    // Verify tradie has unlocked this request
    const unlockDoc = await db.collection('unlockTransactions')
      .where('tradieId', '==', tradieId)
      .where('serviceRequestId', '==', serviceRequestId)
      .where('status', '==', 'completed')
      .get();

    if (unlockDoc.empty) {
      throw new functions.https.HttpsError('permission-denied', 'Must unlock request before submitting quote');
    }

    // Create quote
    const quoteData = {
      serviceRequestId,
      tradieId,
      amount,
      breakdown,
      estimatedStartDate: new Date(estimatedStartDate),
      estimatedCompletionDate: new Date(estimatedCompletionDate),
      notes,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const quoteRef = await db.collection('quotes').add(quoteData);

    // Send notification to customer
    const serviceRequestDoc = await db.collection('serviceRequests').doc(serviceRequestId).get();
    const serviceRequestData = serviceRequestDoc.data();
    
    if (serviceRequestData) {
      await db.collection('notifications').add({
        userId: serviceRequestData.customerId,
        title: 'New Quote Received',
        message: `You received a $${amount} quote for your ${serviceRequestData.tradeType} request`,
        type: 'quote',
        quoteId: quoteRef.id,
        serviceRequestId,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      success: true,
      message: 'Quote submitted successfully',
      quoteId: quoteRef.id
    };
  } catch (error) {
    console.error('Error submitting quote:', error);
    throw new functions.https.HttpsError('internal', 'Failed to submit quote');
  }
});

// Accept quote by customer
export const acceptQuote = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { quoteId, customerAddress, customerPhone } = data;
  const customerId = context.auth.uid;

  try {
    // Get quote
    const quoteDoc = await db.collection('quotes').doc(quoteId).get();
    if (!quoteDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Quote not found');
    }

    const quoteData = quoteDoc.data();
    
    // Verify customer owns the service request
    const serviceRequestDoc = await db.collection('serviceRequests').doc(quoteData.serviceRequestId).get();
    const serviceRequestData = serviceRequestDoc.data();
    
    if (serviceRequestData.customerId !== customerId) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to accept this quote');
    }

    // Update quote status
    await db.collection('quotes').doc(quoteId).update({
      status: 'accepted',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update service request status
    await db.collection('serviceRequests').doc(quoteData.serviceRequestId).update({
      status: 'in-progress',
      acceptedQuoteId: quoteId,
      customerAddress,
      customerPhone,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notification to tradie
    await db.collection('notifications').add({
      userId: quoteData.tradieId,
      title: 'Quote Accepted!',
      message: `Your $${quoteData.amount} quote has been accepted`,
      type: 'quote_accepted',
      quoteId,
      serviceRequestId: quoteData.serviceRequestId,
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'Quote accepted successfully'
    };
  } catch (error) {
    console.error('Error accepting quote:', error);
    throw new functions.https.HttpsError('internal', 'Failed to accept quote');
  }
});

// Recharge wallet
export const rechargeWallet = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, paymentMethod } = data;
  const userId = context.auth.uid;

  try {
    // TODO: Integrate with actual payment processor (Stripe, PayPal, etc.)
    // For now, just add to wallet
    
    // Create wallet transaction record
    await db.collection('walletTransactions').add({
      userId,
      type: 'recharge',
      amount,
      description: `Wallet recharge via ${paymentMethod}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    // Update user's wallet balance
    await db.collection('users').doc(userId).update({
      walletBalance: admin.firestore.FieldValue.increment(amount)
    });

    return {
      success: true,
      message: 'Wallet recharged successfully',
      newBalance: amount
    };
  } catch (error) {
    console.error('Error recharging wallet:', error);
    throw new functions.https.HttpsError('internal', 'Failed to recharge wallet');
  }
});

// Complete service request
export const completeServiceRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { serviceRequestId, rating, review } = data;
  const customerId = context.auth.uid;

  try {
    // Verify customer owns the service request
    const serviceRequestDoc = await db.collection('serviceRequests').doc(serviceRequestId).get();
    const serviceRequestData = serviceRequestDoc.data();
    
    if (serviceRequestData.customerId !== customerId) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to complete this request');
    }

    // Update service request status
    await db.collection('serviceRequests').doc(serviceRequestId).update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      rating,
      review
    });

    // Update tradie's rating and total jobs
    const quoteDoc = await db.collection('quotes')
      .where('serviceRequestId', '==', serviceRequestId)
      .where('status', '==', 'accepted')
      .get();

    if (!quoteDoc.empty) {
      const quoteData = quoteDoc.docs[0].data();
      const tradieRef = db.collection('users').doc(quoteData.tradieId);
      
      // Calculate new rating
      const tradieDoc = await tradieRef.get();
      const tradieData = tradieDoc.data();
      const currentRating = tradieData.rating || 0;
      const totalJobs = tradieData.totalJobs || 0;
      const newRating = ((currentRating * totalJobs) + rating) / (totalJobs + 1);

      await tradieRef.update({
        rating: newRating,
        totalJobs: totalJobs + 1
      });
    }

    return {
      success: true,
      message: 'Service request completed successfully'
    };
  } catch (error) {
    console.error('Error completing service request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to complete service request');
  }
});

// Send push notification
export const sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, title, message, data: notificationData } = data;

  try {
    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.fcmToken) {
      const payload = {
        notification: {
          title,
          body: message
        },
        data: notificationData || {},
        token: userData.fcmToken
      };

      const response = await admin.messaging().send(payload);
      console.log('Successfully sent message:', response);
    }

    return {
      success: true,
      message: 'Notification sent successfully'
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});
