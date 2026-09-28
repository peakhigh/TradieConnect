/**
 * reliabilityService — derives real trust/reliability metrics for a tradie
 * from their quotes history + profile stats. No fabricated numbers: everything
 * is computed from actual `quotes` documents and the user doc.
 *
 * Metrics:
 *  - avgResponseHours: average time from unlock → quote submission.
 *  - winRate: accepted quotes / submitted quotes.
 *  - quotedCount: number of quotes actually submitted.
 *  - rating / totalJobs: passed in from the user doc.
 *
 * Badges are derived from these metrics with conservative thresholds so a
 * badge always reflects genuine track record.
 */
import { db, collection, query, where, getDocs, limit } from './firebase';
import { secureError } from '../utils/logger';

export interface ReliabilityMetrics {
  avgResponseHours: number | null;
  winRate: number | null;
  quotedCount: number;
  acceptedCount: number;
  rating: number;
  totalJobs: number;
}

export type BadgeId = 'topRated' | 'fastResponder' | 'highWinRate' | 'established' | 'newcomer';

export interface ReliabilityBadge {
  id: BadgeId;
  label: string;
  description: string;
}

const toMillis = (value: any): number | null => {
  if (!value) return null;
  if (value?.toDate) return value.toDate().getTime();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.getTime();
};

/**
 * Compute reliability metrics for a tradie from their quotes + profile stats.
 */
export async function computeReliability(
  tradieId: string,
  profile: { rating?: number; totalJobs?: number }
): Promise<ReliabilityMetrics> {
  const metrics: ReliabilityMetrics = {
    avgResponseHours: null,
    winRate: null,
    quotedCount: 0,
    acceptedCount: 0,
    rating: profile.rating || 0,
    totalJobs: profile.totalJobs || 0,
  };

  if (!tradieId) return metrics;

  try {
    const snap = await getDocs(
      query(collection(db, 'quotes'), where('tradieId', '==', tradieId), limit(500))
    );

    let responseSum = 0;
    let responseSamples = 0;

    snap.docs.forEach((d) => {
      const data = d.data();
      const status = data.status;

      // Only quotes actually submitted count toward win rate + response time.
      const submitted = status === 'quoted' || status === 'accepted' || status === 'rejected';
      if (!submitted) return;

      metrics.quotedCount += 1;
      if (status === 'accepted') metrics.acceptedCount += 1;

      const unlockedAt = toMillis(data.unlockedAt) ?? toMillis(data.createdAt);
      const quotedAt = toMillis(data.quotedAt);
      if (unlockedAt && quotedAt && quotedAt >= unlockedAt) {
        responseSum += quotedAt - unlockedAt;
        responseSamples += 1;
      }
    });

    if (responseSamples > 0) {
      metrics.avgResponseHours =
        Math.round((responseSum / responseSamples / (1000 * 60 * 60)) * 10) / 10;
    }
    if (metrics.quotedCount > 0) {
      metrics.winRate = Math.round((metrics.acceptedCount / metrics.quotedCount) * 100) / 100;
    }
  } catch (error) {
    secureError('Error computing reliability:', error);
  }

  return metrics;
}

/**
 * Derive display badges from metrics. Thresholds are deliberately conservative
 * so badges signal a real track record.
 */
export function deriveBadges(m: ReliabilityMetrics): ReliabilityBadge[] {
  const badges: ReliabilityBadge[] = [];

  if (m.rating >= 4.5 && m.totalJobs >= 3) {
    badges.push({
      id: 'topRated',
      label: 'Top Rated',
      description: `${m.rating.toFixed(1)}★ across ${m.totalJobs} jobs`,
    });
  }

  if (m.avgResponseHours != null && m.avgResponseHours <= 6 && m.quotedCount >= 3) {
    badges.push({
      id: 'fastResponder',
      label: 'Fast Responder',
      description:
        m.avgResponseHours < 1
          ? 'Usually quotes within the hour'
          : `Usually quotes within ${Math.round(m.avgResponseHours)}h`,
    });
  }

  if (m.winRate != null && m.winRate >= 0.4 && m.quotedCount >= 5) {
    badges.push({
      id: 'highWinRate',
      label: 'High Win Rate',
      description: `${Math.round(m.winRate * 100)}% of quotes accepted`,
    });
  }

  if (m.totalJobs >= 10) {
    badges.push({
      id: 'established',
      label: 'Established Pro',
      description: `${m.totalJobs}+ completed jobs`,
    });
  }

  // Newcomer only when there's nothing else notable and little history.
  if (badges.length === 0 && m.totalJobs < 3) {
    badges.push({
      id: 'newcomer',
      label: 'New to TradieConnect',
      description: 'Building their reputation',
    });
  }

  return badges;
}
