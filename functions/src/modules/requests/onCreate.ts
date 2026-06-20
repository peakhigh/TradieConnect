import { firestore } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { applyRollupDelta } from '../reporting/rollups';

const db = admin.firestore();

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
    } catch (error) {
      console.error(`Error initializing intel for request ${requestId}:`, error);
    }
  });
