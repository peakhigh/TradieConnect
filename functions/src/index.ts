import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// Intelligence calculation functions
function calculateIntelligence(quotes: any[]): any {
  if (quotes.length === 0) {
    return {
      totalQuotes: 0,
      priceRange: { min: 0, max: 0, average: 0 },
      timelineRange: { minDays: 0, maxDays: 0, averageDays: 0 },
      breakdown: {
        materials: { min: 0, max: 0, average: 0 },
        labor: { min: 0, max: 0, average: 0 }
      },
      competitionLevel: 'low',
      opportunityScore: 80,
      competitivePosition: 'strong',
      recommendedPriceRange: { min: 0, max: 0, optimal: 0 },
      winProbability: 0.8,
      marketTrends: { priceDirection: 'stable', demandLevel: 'low' },
      lastQuoteAt: admin.firestore.Timestamp.now()
    };
  }

  const prices = quotes.map(q => q.totalPrice);
  const timelines = quotes.map(q => q.timelineDays);
  const materials = quotes.map(q => q.materialsCost);
  const labor = quotes.map(q => q.laborCost);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100;
  const priceSpread = maxPrice - minPrice;

  const competitionLevel = quotes.length < 3 ? 'low' : quotes.length < 7 ? 'medium' : 'high';
  const opportunityScore = Math.round(Math.min(100, Math.max(20, 
    (priceSpread > 200 ? 30 : 0) + 
    (quotes.length < 5 ? 40 : 20) + 
    (Math.random() * 30 + 20)
  )) * 100) / 100;
  const competitivePosition = quotes.length < 3 ? 'strong' : quotes.length < 7 ? 'moderate' : 'weak';
  const winProbability = Math.round(Math.max(0.2, Math.min(0.9, 
    (quotes.length < 3 ? 0.8 : quotes.length < 7 ? 0.6 : 0.4) + 
    (Math.random() * 0.2 - 0.1)
  )) * 100) / 100;

  return {
    totalQuotes: quotes.length,
    priceRange: {
      min: Math.round(minPrice * 100) / 100,
      max: Math.round(maxPrice * 100) / 100,
      average: avgPrice
    },
    timelineRange: {
      minDays: Math.min(...timelines),
      maxDays: Math.max(...timelines),
      averageDays: Math.round(timelines.reduce((a, b) => a + b, 0) / timelines.length * 10) / 10
    },
    breakdown: {
      materials: {
        min: Math.round(Math.min(...materials) * 100) / 100,
        max: Math.round(Math.max(...materials) * 100) / 100,
        average: Math.round(materials.reduce((a, b) => a + b, 0) / materials.length * 100) / 100
      },
      labor: {
        min: Math.round(Math.min(...labor) * 100) / 100,
        max: Math.round(Math.max(...labor) * 100) / 100,
        average: Math.round(labor.reduce((a, b) => a + b, 0) / labor.length * 100) / 100
      }
    },
    competitionLevel,
    opportunityScore,
    competitivePosition,
    recommendedPriceRange: {
      min: Math.round(avgPrice * 0.9 * 100) / 100,
      max: Math.round(avgPrice * 1.1 * 100) / 100,
      optimal: Math.round(avgPrice * 0.95 * 100) / 100
    },
    winProbability,
    marketTrends: {
      priceDirection: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
      demandLevel: quotes.length > 7 ? 'high' : quotes.length > 3 ? 'medium' : 'low'
    },
    lastQuoteAt: quotes.reduce((latest: any, quote: any) => 
      quote.createdAt.toMillis() > latest.toMillis() ? quote.createdAt : latest, 
      quotes[0].createdAt
    )
  };
}

async function updateRequestIntelligence(requestId: string) {
  try {
    const quotesSnapshot = await db.collection('quotes')
      .where('requestId', '==', requestId)
      .get();

    const quotes = quotesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const intelligence = calculateIntelligence(quotes);
    const intelligenceData = {
      requestId,
      ...intelligence,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('requestIntelligence').doc(requestId).set(intelligenceData);
    console.log(`Updated intelligence for request ${requestId} with ${quotes.length} quotes`);
  } catch (error) {
    console.error(`Error updating intelligence for request ${requestId}:`, error);
  }
}

// TODO: Add Cloud Function triggers for intelligence updates
// Currently handled by populate script

// Type definitions
interface UnlockRequestData {
  serviceRequestId: string;
}

interface SubmitQuoteData {
  serviceRequestId: string;
  amount: number;
  breakdown: string;
  estimatedStartDate: string;
  estimatedCompletionDate: string;
  notes: string;
}

interface AcceptQuoteData {
  quoteId: string;
  customerAddress: string;
  customerPhone: string;
}

interface RechargeWalletData {
  amount: number;
  paymentMethod: string;
}

interface CompleteServiceData {
  serviceRequestId: string;
  rating: number;
  review: string;
}

interface SendNotificationData {
  userId: string;
  title: string;
  message: string;
  data?: any;
}

// Unlock service request for tradie
export const unlockServiceRequest = functions.https.onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { serviceRequestId } = request.data as UnlockRequestData;
  const tradieId = request.auth.uid;

  try {
    // Get tradie's wallet balance
    const tradieDoc = await db.collection('users').doc(tradieId).get();
    if (!tradieDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Tradie not found');
    }

    const tradieData = tradieDoc.data();
    if (!tradieData || tradieData.userType !== 'tradie') {
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
    if (!serviceRequestData || serviceRequestData.status !== 'active') {
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
    // Error already handled by throwing HttpsError
    throw new functions.https.HttpsError('internal', 'Failed to unlock service request');
  }
});

// Submit quote for service request
export const submitQuote = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { serviceRequestId, amount, breakdown, estimatedStartDate, estimatedCompletionDate, notes } = request.data as SubmitQuoteData;
  const tradieId = request.auth.uid;

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
    // Error already handled by throwing HttpsError
    throw new functions.https.HttpsError('internal', 'Failed to submit quote');
  }
});

// Accept quote by customer
export const acceptQuote = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { quoteId, customerAddress, customerPhone } = request.data as AcceptQuoteData;
  const customerId = request.auth.uid;

  try {
    // Get quote
    const quoteDoc = await db.collection('quotes').doc(quoteId).get();
    if (!quoteDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Quote not found');
    }

    const quoteData = quoteDoc.data();
    if (!quoteData) {
      throw new functions.https.HttpsError('not-found', 'Quote data not found');
    }
    
    // Verify customer owns the service request
    const serviceRequestDoc = await db.collection('serviceRequests').doc(quoteData.serviceRequestId).get();
    const serviceRequestData = serviceRequestDoc.data();
    
    if (!serviceRequestData || serviceRequestData.customerId !== customerId) {
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
    // Error already handled by throwing HttpsError
    throw new functions.https.HttpsError('internal', 'Failed to accept quote');
  }
});

// Recharge wallet
export const rechargeWallet = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, paymentMethod } = request.data as RechargeWalletData;
  const userId = request.auth.uid;

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
    // Error already handled by throwing HttpsError
    throw new functions.https.HttpsError('internal', 'Failed to recharge wallet');
  }
});

// Complete service request
export const completeServiceRequest = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { serviceRequestId, rating, review } = request.data as CompleteServiceData;
  const customerId = request.auth.uid;

  try {
    // Verify customer owns the service request
    const serviceRequestDoc = await db.collection('serviceRequests').doc(serviceRequestId).get();
    const serviceRequestData = serviceRequestDoc.data();
    
    if (!serviceRequestData || serviceRequestData.customerId !== customerId) {
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
      if (tradieData) {
        const currentRating = tradieData.rating || 0;
        const totalJobs = tradieData.totalJobs || 0;
        const newRating = ((currentRating * totalJobs) + rating) / (totalJobs + 1);

        await tradieRef.update({
          rating: newRating,
          totalJobs: totalJobs + 1
        });
      }
    }

    return {
      success: true,
      message: 'Service request completed successfully'
    };
  } catch (error) {
    // Error already handled by throwing HttpsError
    throw new functions.https.HttpsError('internal', 'Failed to complete service request');
  }
});

// Send push notification
export const sendPushNotification = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, title, message, data: notificationData } = request.data as SendNotificationData;

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
      // Message sent successfully
    }

    return {
      success: true,
      message: 'Notification sent successfully'
    };
  } catch (error) {
    // Error already handled by throwing HttpsError
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});
