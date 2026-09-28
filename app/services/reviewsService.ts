/**
 * reviewsService — reads tradie reviews written by completeServiceRequest.
 *
 * Reviews are stored in the `reviews` collection, one doc per completed job:
 *   { tradieId, customerId, customerName, serviceRequestId, quoteId,
 *     trades[], rating, review, jobValue, createdAt }
 *
 * The rolling average on the user doc (`rating`, `totalJobs`) is still the
 * source of truth for the headline number; this service surfaces the
 * individual review text + a rating distribution for display.
 */
import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from './firebase';
import { secureError } from '../utils/logger';

export interface Review {
  id: string;
  tradieId: string;
  customerId: string;
  customerName: string;
  serviceRequestId: string;
  quoteId: string;
  trades: string[];
  rating: number;
  review: string;
  jobValue: number;
  createdAt: Date;
}

export interface ReviewSummary {
  average: number;
  total: number;
  /** Count of reviews per star (index 0 = 1 star ... index 4 = 5 stars) */
  distribution: [number, number, number, number, number];
}

const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

function mapReview(id: string, data: any): Review {
  return {
    id,
    tradieId: data.tradieId || '',
    customerId: data.customerId || '',
    customerName: data.customerName || 'Customer',
    serviceRequestId: data.serviceRequestId || '',
    quoteId: data.quoteId || '',
    trades: data.trades || [],
    rating: data.rating || 0,
    review: data.review || '',
    jobValue: data.jobValue || 0,
    createdAt: toDate(data.createdAt),
  };
}

/**
 * Fetch reviews for a tradie, newest first.
 */
export async function fetchTradieReviews(
  tradieId: string,
  limitCount = 50
): Promise<Review[]> {
  if (!tradieId) return [];
  try {
    const q = query(
      collection(db, 'reviews'),
      where('tradieId', '==', tradieId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapReview(d.id, d.data()));
  } catch (error) {
    secureError('Error fetching tradie reviews:', error);
    return [];
  }
}

/**
 * Compute a rating summary (average + distribution) from a list of reviews.
 * Uses the reviews we actually have; callers can pass the user doc's stored
 * average/total when they want the authoritative headline number instead.
 */
export function summarizeReviews(reviews: Review[]): ReviewSummary {
  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    distribution[star - 1] += 1;
    sum += r.rating;
  }
  const total = reviews.length;
  const average = total > 0 ? Math.round((sum / total) * 100) / 100 : 0;
  return { average, total, distribution };
}
