import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

type TabKey = 'home' | 'jobs' | 'wallet';

const PRIMARY = theme.colors.primary;
const ORANGE = '#f97316';
const GREEN = '#22c55e';
const CYAN = '#06b6d4';
const PURPLE = '#8b5cf6';

function StatCard({ value, label, accent, emoji }: { value: string; label: string; accent: string; emoji: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: accent + '22' }]}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function HomeScreen() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View>
        <Text style={styles.greeting}>
          Hey Dave <Text style={styles.roleBadge}> TRADIE </Text>
        </Text>
        <Text style={styles.dateText}>Friday, 19 Jun 2026 · Sydney NSW</Text>
      </View>
      <View style={styles.row}>
        <StatCard emoji="🧰" value="8" label="New leads" accent={ORANGE} />
        <StatCard emoji="🧾" value="3" label="Quotes sent" accent={CYAN} />
      </View>
      <View style={styles.row}>
        <StatCard emoji="💰" value="$12.50" label="Wallet" accent={GREEN} />
        <StatCard emoji="⭐" value="4.9" label="Rating" accent={PURPLE} />
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Nearest job</Text>
        <View style={styles.cardRow}>
          <View style={[styles.iconBox, { backgroundColor: PRIMARY + '22' }]}>
            <Text style={{ fontSize: 18 }}>🔧</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>Leaking kitchen tap</Text>
            <Text style={styles.subText}>📍 2.3 km · Parramatta</Text>
          </View>
          <View style={styles.unlockBadge}>
            <Text style={styles.unlockText}>50c</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function JobsScreen() {
  const jobs = [
    { name: 'Leaking kitchen tap', loc: '2.3 km · Parramatta', emoji: '🔧', color: CYAN, tag: 'Plumbing' },
    { name: 'Install ceiling fans x3', loc: '4.1 km · Blacktown', emoji: '💡', color: ORANGE, tag: 'Electrical' },
    { name: 'Repaint living room', loc: '6.8 km · Castle Hill', emoji: '🎨', color: PURPLE, tag: 'Painting' },
  ];
  return (
    <View style={{ padding: 16, gap: 11 }}>
      <Text style={styles.screenTitle}>Jobs near you</Text>
      {jobs.map((j) => (
        <View key={j.name} style={styles.panel}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: j.color + '22' }]}>
              <Text style={{ fontSize: 18 }}>{j.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{j.name}</Text>
              <Text style={styles.subText}>{j.loc}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={styles.unlockBadge}>
                <Text style={styles.unlockText}>🔓 50c</Text>
              </View>
              <Text style={[styles.tag, { color: j.color, backgroundColor: j.color + '22' }]}>{j.tag}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function WalletScreen() {
  const txns = [
    { label: 'Signup bonus', amt: '+$10.00', pos: true },
    { label: 'Unlock · Kitchen tap', amt: '-$0.50', pos: false },
    { label: 'Top up', amt: '+$5.00', pos: true },
    { label: 'Unlock · Ceiling fans', amt: '-$0.50', pos: false },
    { label: 'Unlock · Deck repair', amt: '-$0.50', pos: false },
  ];
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={styles.screenTitle}>Wallet</Text>
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Available balance</Text>
        <Text style={styles.walletBalance}>$12.50</Text>
        <Text style={styles.walletSub}>= 25 lead unlocks</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Recent activity</Text>
        {txns.map((t, i) => (
          <View key={i} style={[styles.txnRow, i > 0 && styles.txnDivider]}>
            <Text style={styles.subTextDark}>{t.label}</Text>
            <Text style={[styles.txnAmt, { color: t.pos ? GREEN : '#ea580c' }]}>{t.amt}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const SCREENS: Record<TabKey, React.ReactNode> = {
  home: <HomeScreen />,
  jobs: <JobsScreen />,
  wallet: <WalletScreen />,
};

const TITLES: Record<TabKey, string> = {
  home: 'Dashboard',
  jobs: 'Find Jobs',
  wallet: 'Wallet',
};

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'jobs', label: 'Jobs', emoji: '🧰' },
  { key: 'wallet', label: 'Wallet', emoji: '💰' },
];

export function PhoneDemoNative() {
  const [tab, setTab] = useState<TabKey>('home');

  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        <View style={styles.pillDot} />
        <Text style={styles.pillText}>LIVE DEMO · TAP AROUND</Text>
      </View>

      <View style={styles.phone}>
        <View style={styles.screen}>
          <View style={styles.notch} />
          <View style={styles.statusBar}>
            <Text style={styles.statusTime}>12:10</Text>
            <Text style={styles.statusIcons}>▮▮▮ ▾ ▰</Text>
          </View>
          <View style={styles.appHeader}>
            <Text style={styles.menuIcon}>☰</Text>
            <Text style={styles.appTitle}>{TITLES[tab]}</Text>
            <View style={{ width: 20 }} />
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {SCREENS[tab]}
          </ScrollView>
          <View style={styles.tabBar}>
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)} activeOpacity={0.7}>
                  <Text style={[styles.tabEmoji, { opacity: active ? 1 : 0.4 }]}>{t.emoji}</Text>
                  <Text style={[styles.tabLabel, { color: active ? PRIMARY : '#94a6b8', fontWeight: active ? '700' : '500' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: 24 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0B1220',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: -14,
    zIndex: 3,
  },
  pillDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  phone: {
    width: 300,
    maxWidth: '90%',
    height: 600,
    backgroundColor: '#0B1220',
    borderRadius: 44,
    padding: 12,
  },
  screen: { flex: 1, backgroundColor: '#F4F6FA', borderRadius: 34, overflow: 'hidden' },
  notch: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 110,
    height: 22,
    backgroundColor: '#0B1220',
    borderRadius: 999,
    zIndex: 4,
  },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 11, paddingBottom: 4 },
  statusTime: { fontSize: 12, fontWeight: '700', color: '#131B20' },
  statusIcons: { fontSize: 11, color: '#131B20' },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },
  menuIcon: { fontSize: 18, color: PRIMARY },
  appTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#131B20' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEF1F5', backgroundColor: '#fff', paddingBottom: 10, paddingTop: 7 },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontSize: 10 },

  row: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EEF1F5', padding: 12, gap: 4 },
  statIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#131B20' },
  statLabel: { fontSize: 12, color: '#5B6B7C' },
  greeting: { fontSize: 20, fontWeight: '700', color: '#131B20' },
  roleBadge: { fontSize: 11, fontWeight: '700', color: PRIMARY, backgroundColor: PRIMARY + '22' },
  dateText: { fontSize: 12, color: '#94A6B8' },
  panel: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EEF1F5', padding: 12, gap: 8 },
  panelTitle: { fontSize: 13, fontWeight: '700', color: '#131B20' },
  screenTitle: { fontSize: 18, fontWeight: '700', color: '#131B20' },
  itemTitle: { fontSize: 13, fontWeight: '600', color: '#131B20' },
  subText: { fontSize: 11, color: '#94A6B8' },
  subTextDark: { fontSize: 12, color: '#5B6B7C' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  unlockBadge: { backgroundColor: PRIMARY + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  unlockText: { fontSize: 11, fontWeight: '700', color: PRIMARY },
  tag: { fontSize: 10, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  walletCard: { borderRadius: 16, padding: 16, backgroundColor: PRIMARY },
  walletLabel: { fontSize: 12, color: '#cfe0f5' },
  walletBalance: { fontSize: 30, fontWeight: '700', color: '#fff' },
  walletSub: { fontSize: 11, color: '#cfe0f5' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  txnDivider: { borderTopWidth: 1, borderTopColor: '#F4F6FA' },
  txnAmt: { fontSize: 12, fontWeight: '700' },
});
