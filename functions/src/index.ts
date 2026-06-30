import * as admin from 'firebase-admin';
admin.initializeApp();

// Re-export all functions from modules
export { onServiceRequestCreated } from './modules/requests/onCreate';
export { unlockServiceRequest } from './modules/requests/unlock';
export { submitQuote } from './modules/requests/submitQuote';
export { acceptQuote } from './modules/requests/acceptQuote';
export { declineQuote } from './modules/requests/declineQuote';
export { rechargeWallet } from './modules/payments/rechargeWallet';
export { createPaymentIntent } from './modules/payments/createPaymentIntent';
export { createCheckoutSession } from './modules/payments/createCheckoutSession';
export { confirmCheckoutRecharge } from './modules/payments/confirmCheckoutRecharge';
export { stripeWebhook } from './modules/payments/stripeWebhook';
export { completeServiceRequest } from './modules/requests/complete';
export { sendPushNotification } from './modules/notifications/sendPush';
export { onChatMessageCreated } from './modules/chat/onMessageCreated';

// Auth / account management
export { completeOnboarding } from './modules/auth/completeOnboarding';
export { deleteUserData } from './modules/auth/deleteUserData';

// Admin
export {
  adminSetTradieApproval,
  adminSetUserStatus,
  getAdminStats,
} from './modules/admin/adminActions';

// Reporting
export {
  getMySuburbReport,
  getSuburbDetail,
  rankSuburbs,
  rankTrades,
  getNearbySuburbReport,
} from './modules/reporting/read';
export { reconcileReportingRollups } from './modules/reporting/reconcile';
