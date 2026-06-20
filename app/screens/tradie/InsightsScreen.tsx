import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Container } from '../../components/UI/Container';
import { StatCard } from '../../components/UI/StatCard';
import { EmptyState } from '../../components/UI/EmptyState';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { getMySuburbReport } from '../../services/reportingService';
import { SuburbTradeStat } from '../../types/reporting';
import { BarComparison } from '../../components/reports/BarComparison';
import { DonutShare } from '../../components/reports/DonutShare';
import { SuburbStatRow } from '../../components/reports/SuburbStatRow';
import { TrendingUp, BarChart3, MapPin, Lightbulb, ChevronRight } from 'lucide-react-native';

export default function InsightsScreen() {
  const { user } = useAuth();
  const { navigate } = useScreenNavigation();
  const [rows, setRows] = useState<SuburbTradeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const suburbs = useMemo(
    () => (user?.interestedSuburbs || []).map((p) => ({ postcode: p, suburb: '' })),
    [user?.interestedSuburbs]
  );
  const trades = useMemo(() => user?.interestedTrades || [], [user?.interestedTrades]);

  useEffect(() => {
    if (suburbs.length === 0 || trades.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMySuburbReport(suburbs, trades)
      .then((res) => { if (!cancelled) { setRows(res); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load insights'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [suburbs, trades]);

  // Headline totals across the tradie's market.
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.requests += r.requestCount;
        acc.active += r.activeRequestCount;
        acc.value += r.acceptedValue;
        acc.quotes += r.quoteCount;
        return acc;
      },
      { requests: 0, active: 0, value: 0, quotes: 0 }
    );
  }, [rows]);

  // Best opportunity = low competition + decent demand, ranked by active requests.
  const opportunities = useMemo(() => {
    return [...rows]
      .filter((r) => r.activeRequestCount > 0)
      .sort((a, b) => {
        const score = (r: SuburbTradeStat) =>
          r.activeRequestCount * 2 + (r.competitionLevel === 'low' ? 5 : r.competitionLevel === 'medium' ? 2 : 0);
        return score(b) - score(a);
      })
      .slice(0, 5);
  }, [rows]);

  const valueByTrade = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => { map[r.trade] = (map[r.trade] || 0) + (r.acceptedValue || r.totalQuotedValue || 0); });
    return Object.entries(map).map(([label, value]) => ({ label, value })).filter((d) => d.value > 0);
  }, [rows]);

  const demandBySuburb = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      const key = `${r.suburb || r.postcode}`;
      map[key] = (map[key] || 0) + r.requestCount;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const money = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`);

  if (loading) {
    return (
      <Container style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      </Container>
    );
  }

  if (suburbs.length === 0 || trades.length === 0) {
    return (
      <Container style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Market Insights</Text></View>
        <EmptyState
          title="Set up your profile first"
          message="Add your trades and service suburbs in your profile to unlock market insights."
        />
      </Container>
    );
  }

  return (
    <Container scrollable={false} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Market Insights</Text>
          <Text style={styles.subtitle}>How your trades and suburbs are performing</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Headline stats */}
        <View style={styles.statsRow}>
          <StatCard number={totals.active} label="Open Jobs" color={theme.colors.primary} />
          <StatCard number={totals.requests} label="Total Requests" color={theme.colors.text.primary} />
          <StatCard number={money(totals.value)} label="Market Value" color={theme.colors.success} />
        </View>

        {/* Quick links */}
        <View style={styles.linkRow}>
          <TouchableOpacity style={styles.linkCard} onPress={() => navigate('SuburbRankings')}>
            <BarChart3 size={20} color={theme.colors.primary} />
            <Text style={styles.linkTitle}>Suburb Rankings</Text>
            <Text style={styles.linkSub}>Where the money & demand is</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard} onPress={() => navigate('TradeOpportunity')}>
            <Lightbulb size={20} color="#d97706" />
            <Text style={styles.linkTitle}>New Trades</Text>
            <Text style={styles.linkSub}>Opportunities to expand</Text>
          </TouchableOpacity>
        </View>

        {/* Best opportunities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={16} color={theme.colors.success} />
            <Text style={styles.sectionTitle}>Best Opportunities For You</Text>
          </View>
          {opportunities.length === 0 ? (
            <Text style={styles.empty}>No open jobs in your market right now. Check back soon.</Text>
          ) : (
            opportunities.map((r) => (
              <SuburbStatRow
                key={r.id}
                suburb={r.suburb || r.postcode}
                postcode={r.suburb ? r.postcode : undefined}
                trade={r.trade}
                requestCount={r.activeRequestCount}
                acceptedValue={r.acceptedValue}
                totalQuotedValue={r.totalQuotedValue}
                competitionLevel={r.competitionLevel}
                onPress={() => navigate('SuburbDetail', { suburbKey: r.suburbKey, suburb: r.suburb, postcode: r.postcode })}
              />
            ))
          )}
        </View>

        {/* Value by trade */}
        {valueByTrade.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Value by Trade</Text>
            </View>
            <View style={styles.card}>
              <DonutShare data={valueByTrade} centerLabel={money(totals.value)} />
            </View>
          </View>
        )}

        {/* Demand by suburb */}
        {demandBySuburb.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={16} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Requests by Suburb</Text>
            </View>
            <View style={styles.card}>
              <BarComparison data={demandBySuburb} valueSuffix="" />
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  header: { marginBottom: 16 },
  title: {
    fontSize: Platform.OS === 'web' ? 26 : 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  subtitle: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 2 },
  errorText: { color: theme.colors.error, fontSize: 13, marginBottom: 12 },
  statsRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 16 },
  linkRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  linkCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  linkTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginTop: 8 },
  linkSub: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  empty: { fontSize: 13, color: theme.colors.text.tertiary, paddingVertical: 8 },
});
