import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Container } from '../../components/UI/Container';
import { StatCard } from '../../components/UI/StatCard';
import { theme } from '../../theme/theme';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { getSuburbDetail } from '../../services/reportingService';
import { SuburbStat, SuburbTradeStat } from '../../types/reporting';
import { BarComparison } from '../../components/reports/BarComparison';
import { ArrowLeft } from 'lucide-react-native';

interface Props {
  suburbKey?: string;
  suburb?: string;
  postcode?: string;
}

export default function SuburbDetailScreen({ suburbKey, suburb, postcode }: Props) {
  const { navigate } = useScreenNavigation();
  const [total, setTotal] = useState<SuburbStat | null>(null);
  const [trades, setTrades] = useState<SuburbTradeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSuburbDetail({ suburbKey, suburb, postcode })
      .then((res) => { if (!cancelled) { setTotal(res.total); setTrades(res.trades); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load suburb'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [suburbKey, suburb, postcode]);

  const money = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n || 0)}`);
  const title = suburb || total?.suburb || postcode || 'Suburb';

  const valueByTrade = useMemo(
    () => trades.map((t) => ({ label: t.trade, value: t.acceptedValue || t.totalQuotedValue || 0 })).filter((d) => d.value > 0),
    [trades]
  );
  const requestsByTrade = useMemo(
    () => trades.map((t) => ({ label: t.trade, value: t.requestCount })).filter((d) => d.value > 0),
    [trades]
  );

  return (
    <Container scrollable={false} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Insights')} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{title}</Text>
          {postcode ? <Text style={styles.subtitle}>{postcode}</Text> : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : !total && trades.length === 0 ? (
        <Text style={styles.empty}>No activity recorded for this suburb yet.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <StatCard number={total?.activeRequestCount ?? 0} label="Open Jobs" color={theme.colors.primary} />
            <StatCard number={total?.requestCount ?? 0} label="Requests" color={theme.colors.text.primary} />
            <StatCard number={money(total?.acceptedValue ?? 0)} label="Value Won" color={theme.colors.success} />
          </View>

          <View style={styles.statsRow}>
            <StatCard number={total?.quoteCount ?? 0} label="Quotes" color={theme.colors.text.primary} />
            <StatCard number={money(total?.avgQuoteValue ?? 0)} label="Avg Quote" color={theme.colors.text.primary} />
            <StatCard number={total?.competitionLevel ?? 'low'} label="Competition" color="#d97706" />
          </View>

          {valueByTrade.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Value by Trade</Text>
              <View style={styles.card}><BarComparison data={valueByTrade} valuePrefix="$" /></View>
            </View>
          )}

          {requestsByTrade.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requests by Trade</Text>
              <View style={styles.card}><BarComparison data={requestsByTrade} /></View>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { padding: 4 },
  title: { fontSize: Platform.OS === 'web' ? 22 : 20, fontWeight: '700', color: theme.colors.text.primary },
  subtitle: { fontSize: 13, color: theme.colors.text.secondary },
  scroll: { padding: 16 },
  statsRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 12 },
  section: { marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 12 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border.light },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  errorText: { color: theme.colors.error, fontSize: 13, padding: 16 },
  empty: { fontSize: 14, color: theme.colors.text.tertiary, textAlign: 'center', padding: 24 },
});
