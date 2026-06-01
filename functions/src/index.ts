import * as admin from 'firebase-admin';
admin.initializeApp();

// Re-export all functions from modules
export { onServiceRequestCreated } from './modules/requests/onCreate';
export { unlockServiceRequest } from './modules/requests/unlock';
export { submitQuote } from './modules/requests/submitQuote';
export { acceptQuote } from './modules/requests/acceptQuote';
export { rechargeWallet } from './modules/payments/rechargeWallet';
export { completeServiceRequest } from './modules/requests/complete';
export { sendPushNotification } from './modules/notifications/sendPush';
