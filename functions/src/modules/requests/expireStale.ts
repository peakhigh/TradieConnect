import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { applyRollupDelta } from '../reporting/rollups';
import { refundUnlocks } from '../payments/refundUnlocks';

const db = admin.firestore();

// A request with no activity for this many days is considered stale.
const EXPIRY_DAYS = 30;

/**
 * Scheduled sweeper: expire stale requests.
 *
 * A request in 'new' or 'quoted' status whose most recent activity
 * (updatedAt, falling back to createdAt) is older than EXPIRY_DAYS is moved to
 * 'expired'. Any tradies who unlocked it are refunded their unlock fee, and the
 * customer is notified.
 *
 * Runs daily at 03:30 Australia/Sydney (after the reporting reconcile at 03:00).
 */
export const expireStaleRequests = onSchedule(
  { schedule: '30 3 * * *', timeZone: 'Australia/Sydney' },
  async () => {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000));

    // Query the two live statuses separately (Firestore can't range-filter on a
    // field while also using 'in' on another without a composite index; two
    // simple queries keep this index-free).
    const statuses = ['new', 'quoted'];
    let expiredCount = 0;

    for (const status of statuses) {
      const snap = await db
        .collection('serviceRequests')
        .where('status', '==', status)
        .where('createdAt', '<=', cutoff)
        .get();

      for (const reqDoc of snap.docs) {
        const data = reqDoc.data();

        // Prefer updatedAt for the "last activity" check; fall back to createdAt.
        const lastActivity: Timestamp = data.updatedAt || data.createdAt;
        if (lastActivity && lastActivity.toMillis() > cutoff.toMillis()) {
          continue; // recent activity — not stale
        }

        try {
          await reqDoc.ref.update({
            status: 'expired',
            expiredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Refund every tradie who unlocked but didn't win.
          await refundUnlocks(reqDoc.id, 'request expired');

          // Remove from active reporting count.
          await applyRollupDelta(
            {
              suburb: data.suburb,
              postcode: data.postcode,
              state: data.state,
              trades: data.trades || [],
            },
            { activeRequestCount: -1 }
          );

          // Notify the customer.
          if (data.customerId) {
            await db.collection('notifications').add({
              userId: data.customerId,
              title: 'Request expired',
              message: `Your ${
                data.trades ? data.trades.join(', ') : 'service'
              } request expired after ${EXPIRY_DAYS} days of inactivity. You can post it again anytime.`,
              type: 'request_expired',
              serviceRequestId: reqDoc.id,
              itemId: reqDoc.id,
              goto: 'requestdetail',
              read: false,
              createdAt: FieldValue.serverTimestamp(),
            });
          }

          expiredCount += 1;
        } catch (err) {
          console.error(`Failed to expire request ${reqDoc.id}:`, err);
        }
      }
    }

    console.log(`Expiry sweep complete: expired ${expiredCount} request(s).`);
  }
);
