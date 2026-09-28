import { firestore } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { applyRollupDelta } from '../reporting/rollups';
import { sendPushToUser } from '../notifications/push';

const db = admin.firestore();

/**
 * Match a new request against tradies' active saved searches and fire a job
 * alert (push + in-app notification) to each matching tradie.
 *
 * Match rule: the saved search's trades intersect the request's trades AND
 * (the saved search has no suburb filter OR the request's postcode is in it)
 * AND (no urgency filter OR the request's urgency is in it).
 */
async function notifyMatchingSavedSearches(
  requestId: string,
  data: FirebaseFirestore.DocumentData,
  tradesLower: string[]
): Promise<void> {
  if (tradesLower.length === 0) return;

  const postcode = data.postcode || '';
  const urgency = data.urgency || '';
  const tradeDisplay = (data.trades || []).join(', ') || 'a new job';

  // Firestore array-contains-any supports up to 10 values.
  const tradeQueryValues = tradesLower.slice(0, 10);

  const matchesSnap = await db
    .collection('savedSearches')
    .where('active', '==', true)
    .where('trades', 'array-contains-any', tradeQueryValues)
    .get();

  if (matchesSnap.empty) return;

  // De-dupe by tradie (a tradie could have multiple matching searches).
  const notifiedTradies = new Set<string>();

  for (const searchDoc of matchesSnap.docs) {
    const search = searchDoc.data();
    const tradieId = search.tradieId;
    if (!tradieId || notifiedTradies.has(tradieId)) continue;

    // Suburb (postcode) filter.
    const suburbs: string[] = search.suburbs || [];
    if (suburbs.length > 0 && postcode && !suburbs.includes(postcode)) continue;

    // Urgency filter.
    const urgencyFilter: string[] = search.urgency || [];
    if (urgencyFilter.length > 0 && urgency && !urgencyFilter.includes(urgency)) continue;

    // Don't alert a tradie about their own... (requests are customer-owned, so
    // this is just a guard against self-notify if roles ever overlap).
    if (tradieId === data.customerId) continue;

    notifiedTradies.add(tradieId);

    const title = 'New job matches your alert';
    const body = `${tradeDisplay}${postcode ? ` in ${postcode}` : ''} was just posted.`;

    try {
      await db.collection('notifications').add({
        userId: tradieId,
        title,
        message: body,
        type: 'job_alert',
        serviceRequestId: requestId,
        itemId: requestId,
        goto: 'explorer',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      await sendPushToUser(tradieId, {
        title,
        body,
        data: { type: 'job_alert', goto: 'explorer', itemId: requestId },
      });
    } catch (err) {
      console.error(`Failed to alert tradie ${tradieId} for request ${requestId}:`, err);
    }
  }
}

/**
 * Firestore trigger: when a new serviceRequest is created,
 * initialize all intel_* fields with defaults and compute tradesLower.
 */
export const onServiceRequestCreated = firestore
  .onDocumentCreated('serviceRequests/{requestId}', async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const requestId = event.params.requestId;

    // Compute tradesLower from trades array
    const trades: string[] = data.trades || [];
    const tradesLower = trades.map((t: string) => t.toLowerCase());

    const updates: Record<string, any> = {
      tradesLower,
      status: data.status || 'new',

      // Intelligence defaults
      intel_totalQuotes: 0,
      intel_totalUnlocks: 0,
      intel_priceMin: 0,
      intel_priceMax: 0,
      intel_priceAverage: 0,
      intel_timelineMinDays: 0,
      intel_timelineMaxDays: 0,
      intel_timelineAvgDays: 0,
      intel_materialsMin: 0,
      intel_materialsMax: 0,
      intel_materialsAvg: 0,
      intel_laborMin: 0,
      intel_laborMax: 0,
      intel_laborAvg: 0,
      intel_competitionLevel: 'low',
      intel_opportunityScore: 90,
      intel_competitivePosition: 'strong',
      intel_recommendedPriceMin: 0,
      intel_recommendedPriceMax: 0,
      intel_recommendedPriceOptimal: 0,
      intel_winProbability: 0.85,
      intel_priceGap: 0,
      intel_priceGapCategory: 'small',
      intel_priceDirection: 'stable',
      intel_demandLevel: 'low',
      intel_lastQuoteAt: null,
      intel_updatedAt: FieldValue.serverTimestamp(),
    };

    try {
      await db.collection('serviceRequests').doc(requestId).update(updates);
      console.log(`Initialized intel fields for request ${requestId}`);

      // Reporting rollups: a new request adds to request + active counts.
      await applyRollupDelta(
        { suburb: data.suburb, postcode: data.postcode, state: data.state, trades },
        { requestCount: 1, activeRequestCount: 1 }
      );

      // Job alerts: notify tradies whose active saved searches match.
      await notifyMatchingSavedSearches(requestId, data, tradesLower);
    } catch (error) {
      console.error(`Error initializing intel for request ${requestId}:`, error);
    }
  });
