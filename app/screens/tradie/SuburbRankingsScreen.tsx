import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { rankSuburbs } from '../../services/reportingService';
import { SuburbTradeStat, RankSortBy } from '../../types/reporting';
import { SuburbStatRow } from '../../components/reports/SuburbStatRow';
import { ArrowLeft } from 'lucide-react-native';

const SORTS: { key: RankSortBy; label: string }[] = [
  { key: 'acceptedValue', label: 'Money' },
  { key: 'requestCount', label: 'Requests' },
  { key: 'quoteCount', label: 'Quotes' },
  { key: 'avgQuoteValue', label: 'Avg Quote' },
];

export default function SuburbRankingsScreen() {
  const { user } = useAuth();
  const { navigate } = useScreenNavigation();
  const trades = useMemo(() => user?.interestedTrades || [], [user?.interestedTrades]);
  const [selectedTrade, setSelectedTrade] = useState<string>(trades[0] || '');
  const [sortBy, setSortBy] = useState<RankSortBy>('acceptedValue');
  const [rows, setRows] = useState<SuburbTradeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTrade) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    rankSuburbs(selectedTrade, sortBy, 25)
      .then((res) => { if (!cancelled) { setRows(res); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load rankings'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTrade, sortBy]);

  return (
    <Container scrollable={false} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Dashboard')} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Suburb Rankings</Text>
      </View>

      {/* Trade selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
        {trades.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, selectedTrade === t && styles.chipActive]}
            onPress={() => setSelectedTrade(t)}
          >
            <Text style={[styles.chipText, selectedTrade === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort selector */}
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
        <Text style={styles.empty}>No data for {selectedTrade} yet.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {rows.map((r, i) => (
            <SuburbStatRow
              key={r.id}
              rank={i + 1}
              suburb={r.suburb || r.postcode}
              postcode={r.suburb ? r.postcode : undefined}
              requestCount={r.requestCount}
              acceptedValue={r.acceptedValue}
              totalQuotedValue={r.totalQuotedValue}
              competitionLevel={r.competitionLevel}
              onPress={() => navigate('SuburbDetail', { suburbKey: r.suburbKey, suburb: r.suburb, postcode: r.postcode })}
            />
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
  chipsRow: { maxHeight: 48, paddingHorizontal: 12 },
  chipsContent: { gap: 8, paddingVertical: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border.light, backgroundColor: theme.colors.surface },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary },
  chipTextActive: { color: '#fff' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, flexWrap: 'wrap' },
  sortLabel: { fontSize: 12, color: theme.colors.text.tertiary, marginRight: 4 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border.light },
  sortChipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  sortChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
  sortChipTextActive: { color: theme.colors.primary },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  errorText: { color: theme.colors.error, fontSize: 13, padding: 16 },
  empty: { fontSize: 14, color: theme.colors.text.tertiary, textAlign: 'center', padding: 24 },
});
