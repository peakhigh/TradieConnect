import { FieldValue, Timestamp } from 'firebase-admin/firestore';

interface QuoteDoc {
  totalPrice: number;
  materialsCost: number;
  laborCost: number;
  timelineDays: number;
  quotedAt: Timestamp | null;
}

interface IntelligenceResult {
  intel_totalQuotes: number;
  intel_priceMin: number;
  intel_priceMax: number;
  intel_priceAverage: number;
  intel_timelineMinDays: number;
  intel_timelineMaxDays: number;
  intel_timelineAvgDays: number;
  intel_materialsMin: number;
  intel_materialsMax: number;
  intel_materialsAvg: number;
  intel_laborMin: number;
  intel_laborMax: number;
  intel_laborAvg: number;
  intel_competitionLevel: 'low' | 'medium' | 'high';
  intel_opportunityScore: number;
  intel_competitivePosition: 'strong' | 'moderate' | 'weak';
  intel_recommendedPriceMin: number;
  intel_recommendedPriceMax: number;
  intel_recommendedPriceOptimal: number;
  intel_winProbability: number;
  intel_priceGap: number;
  intel_priceGapCategory: 'small' | 'medium' | 'large';
  intel_priceDirection: 'up' | 'down' | 'stable';
  intel_demandLevel: 'low' | 'medium' | 'high';
  intel_lastQuoteAt: Timestamp | null;
  intel_updatedAt: FieldValue;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Recalculates all intelligence fields based on quoted docs and current unlock count.
 * Uses the algorithm from docs/intelligence-algorithm.md.
 */
export function recalculateIntelligence(
  quotedDocs: QuoteDoc[],
  totalUnlocks: number,
  requestCreatedAt?: Timestamp
): IntelligenceResult {
  const totalQuotes = quotedDocs.length;

  if (totalQuotes === 0) {
    return {
      intel_totalQuotes: 0,
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
  }

  const prices = quotedDocs.map(q => q.totalPrice);
  const timelines = quotedDocs.map(q => q.timelineDays);
  const materials = quotedDocs.map(q => q.materialsCost);
  const labor = quotedDocs.map(q => q.laborCost);

  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const priceAverage = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const timelineMin = Math.min(...timelines);
  const timelineMax = Math.max(...timelines);
  const timelineAvg = Math.round((timelines.reduce((a, b) => a + b, 0) / timelines.length) * 10) / 10;
  const materialsMin = Math.min(...materials);
  const materialsMax = Math.max(...materials);
  const materialsAvg = Math.round(materials.reduce((a, b) => a + b, 0) / materials.length);
  const laborMin = Math.min(...labor);
  const laborMax = Math.max(...labor);
  const laborAvg = Math.round(labor.reduce((a, b) => a + b, 0) / labor.length);

  // Competition Level
  let competitionLevel: 'low' | 'medium' | 'high';
  if (totalQuotes < 3) competitionLevel = 'low';
  else if (totalQuotes < 7) competitionLevel = 'medium';
  else competitionLevel = 'high';

  // Price Gap
  const priceGap = priceMax - priceMin;
  let priceGapCategory: 'small' | 'medium' | 'large';
  if (priceGap > 200) priceGapCategory = 'large';
  else if (priceGap > 100) priceGapCategory = 'medium';
  else priceGapCategory = 'small';

  // Opportunity Score (0-100)
  let score = 50;

  // Competition factor (40%)
  if (totalQuotes === 0) score += 40;
  else if (totalQuotes < 3) score += 30;
  else if (totalQuotes < 5) score += 20;
  else if (totalQuotes < 8) score += 10;
  else score -= 10;

  // Price spread factor (30%)
  const spreadPct = priceAverage > 0 ? (priceGap / priceAverage) * 100 : 0;
  if (spreadPct > 50) score += 30;
  else if (spreadPct > 25) score += 20;
  else if (spreadPct > 10) score += 10;

  // Budget factor (20%)
  if (priceAverage > 2000) score += 20;
  else if (priceAverage > 1000) score += 15;
  else if (priceAverage > 500) score += 10;

  // Freshness factor (10%)
  if (requestCreatedAt) {
    const hoursOld = (Date.now() - requestCreatedAt.toMillis()) / (1000 * 60 * 60);
    if (hoursOld < 2) score += 10;
    else if (hoursOld < 6) score += 5;
    else if (hoursOld > 48) score -= 10;
  }

  // Unlock-to-quote bonus
  if (totalUnlocks > 3 && totalQuotes < 3) score += 5;

  const opportunityScore = clamp(score, 10, 100);

  // Win Probability
  let winProbability: number;
  if (totalQuotes < 3) winProbability = 0.75;
  else if (totalQuotes < 5) winProbability = 0.55;
  else if (totalQuotes < 7) winProbability = 0.40;
  else winProbability = 0.25;

  // Competitive Position
  let competitivePosition: 'strong' | 'moderate' | 'weak';
  if (totalQuotes < 3) competitivePosition = 'strong';
  else if (totalQuotes < 7) competitivePosition = 'moderate';
  else competitivePosition = 'weak';

  // Recommended Price Range
  const recommendedPriceMin = Math.round(priceAverage * 0.90);
  const recommendedPriceMax = Math.round(priceAverage * 1.10);
  const recommendedPriceOptimal = Math.round(priceAverage * 0.95);

  // Market Trends - Price Direction
  let priceDirection: 'up' | 'down' | 'stable' = 'stable';
  if (quotedDocs.length >= 4) {
    // Sort by quotedAt date (most recent first)
    const sorted = [...quotedDocs]
      .filter(q => q.quotedAt !== null)
      .sort((a, b) => {
        const aTime = a.quotedAt ? a.quotedAt.toMillis() : 0;
        const bTime = b.quotedAt ? b.quotedAt.toMillis() : 0;
        return bTime - aTime; // most recent first
      });

    if (sorted.length >= 4) {
      const half = Math.floor(sorted.length / 2);
      const recentHalf = sorted.slice(0, half);
      const olderHalf = sorted.slice(half);

      const recentAvg = recentHalf.reduce((sum, q) => sum + q.totalPrice, 0) / recentHalf.length;
      const olderAvg = olderHalf.reduce((sum, q) => sum + q.totalPrice, 0) / olderHalf.length;

      if (recentAvg > olderAvg * 1.05) priceDirection = 'up';
      else if (recentAvg < olderAvg * 0.95) priceDirection = 'down';
      else priceDirection = 'stable';
    }
  }

  // Demand Level
  const totalInterest = totalUnlocks + totalQuotes;
  let demandLevel: 'low' | 'medium' | 'high';
  if (totalInterest > 12) demandLevel = 'high';
  else if (totalInterest > 5) demandLevel = 'medium';
  else demandLevel = 'low';

  // Last quote timestamp
  let lastQuoteAt: Timestamp | null = null;
  const quotesWithTimestamp = quotedDocs.filter(q => q.quotedAt !== null);
  if (quotesWithTimestamp.length > 0) {
    lastQuoteAt = quotesWithTimestamp.reduce((latest, q) => {
      if (!latest) return q.quotedAt;
      if (!q.quotedAt) return latest;
      return q.quotedAt.toMillis() > latest.toMillis() ? q.quotedAt : latest;
    }, null as Timestamp | null);
  }

  return {
    intel_totalQuotes: totalQuotes,
    intel_priceMin: priceMin,
    intel_priceMax: priceMax,
    intel_priceAverage: priceAverage,
    intel_timelineMinDays: timelineMin,
    intel_timelineMaxDays: timelineMax,
    intel_timelineAvgDays: timelineAvg,
    intel_materialsMin: materialsMin,
    intel_materialsMax: materialsMax,
    intel_materialsAvg: materialsAvg,
    intel_laborMin: laborMin,
    intel_laborMax: laborMax,
    intel_laborAvg: laborAvg,
    intel_competitionLevel: competitionLevel,
    intel_opportunityScore: opportunityScore,
    intel_competitivePosition: competitivePosition,
    intel_recommendedPriceMin: recommendedPriceMin,
    intel_recommendedPriceMax: recommendedPriceMax,
    intel_recommendedPriceOptimal: recommendedPriceOptimal,
    intel_winProbability: winProbability,
    intel_priceGap: priceGap,
    intel_priceGapCategory: priceGapCategory,
    intel_priceDirection: priceDirection,
    intel_demandLevel: demandLevel,
    intel_lastQuoteAt: lastQuoteAt,
    intel_updatedAt: FieldValue.serverTimestamp(),
  };
}
