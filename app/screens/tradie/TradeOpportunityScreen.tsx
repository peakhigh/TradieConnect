import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { rankTrades } from '../../services/reportingService';
import { TradeStat, RankSortBy } from '../../types/reporting';
import { ArrowLeft, DollarSign, FileText, Wrench, Lightbulb } from 'lucide-react-native';

const SORTS: { key: RankSortBy; label: string }[] = [
  { key: 'requestCount', label: 'Demand' },
  { key: 'acceptedValue', label: 'Money' },
  { key: 'avgQuoteValue', label: 'Avg Quote' },
];

export default function TradeOpportunityScreen() {
  const { user } = useAuth();
  const { navigate } = useScreenNavigation();
  const myTrades = useMemo(() => user?.interestedTrades || [], [user?.interestedTrades]);
  const [sortBy, setSortBy] = useState<RankSortBy>('requestCount');
  const [rows, setRows] = useState<TradeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    rankTrades(sortBy, myTrades, 40)
      .then((res) => { if (!cancelled) { setRows(res); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load trades'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sortBy, myTrades]);

  const money = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n || 0)}`);

  return (
    <Container scrollable={false} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Insights')} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>New Trade Opportunities</Text>
          <Text style={styles.subtitle}>Trades you don't offer yet, ranked by the market</Text>
        </View>
      </View>

      <View style={styles.banner}>
        <Lightbulb size={16} color="#d97706" />
        <Text style={styles.bannerText}>Consider expanding into high-demand trades to win more work.</Text>
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by</Text>
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortChip, sortBy === s.key && styles.sortChipActive]}
            onPress={() => setSortBy(s.key)}
          >
            <Text style={[styles.sortChipText, sortBy === s.key && styles.sortChipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>No trade data available yet.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {rows.map((t, i) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <View style={styles.iconCircle}><Wrench size={16} color={theme.colors.primary} /></View>
                <Text style={styles.tradeName} numberOfLines={1}>{t.trade}</Text>
              </View>
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <FileText size={12} color={theme.colors.text.secondary} />
                  <Text style={styles.metricValue}>{t.requestCount}</Text>
                </View>
                <View style={styles.metric}>
                  <DollarSign size={12} color="#16a34a" />
                  <Text style={[styles.metricValue, { color: '#16a34a' }]}>{money(t.acceptedValue || t.totalQuotedValue)}</Text>
                </View>
              </View>
            </View>
          ))}
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
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', marginHorizontal: 16, marginVertical: 8,
    padding: 12, borderRadius: 10,
  },
  bannerText: { flex: 1, fontSize: 12, color: '#92400E' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  sortLabel: { fontSize: 12, color: theme.colors.text.tertiary, marginRight: 4 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border.light },
  sortChipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  sortChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
  sortChipTextActive: { color: theme.colors.primary },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.surface, borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: theme.colors.border.light,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  rank: { fontSize: 13, fontWeight: '700', color: theme.colors.text.tertiary, width: 28 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  tradeName: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, flex: 1 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metricValue: { fontSize: 12, fontWeight: '600', color: theme.colors.text.primary },
});
