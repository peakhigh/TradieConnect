import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { runCloudFunction } from '../../services/cloudFunctions';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';
import { formatCurrency, timestampToReadable } from '../../utils/helpers';
import { Users, Wallet, CheckCircle2, XCircle, ShieldOff, ShieldCheck, RefreshCw, LogOut } from 'lucide-react-native';
import { useAlert } from '../../components/UI/AlertProvider';

interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalTradies: number;
  pendingApprovals: number;
  totalRevenue: number;
  totalUnlocks: number;
}

interface UserRow {
  id: string;
  displayName: string;
  userType: string;
  status?: string;
  isApproved?: boolean;
  walletBalance?: number;
}

const ZERO: AdminStats = {
  totalUsers: 0, totalCustomers: 0, totalTradies: 0, pendingApprovals: 0, totalRevenue: 0, totalUnlocks: 0,
};

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const { showAlert } = useAlert();
  const [stats, setStats] = useState<AdminStats>(ZERO);
  const [pending, setPending] = useState<UserRow[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const mapUser = (d: any): UserRow => {
    const u = d.data();
    return {
      id: d.id,
      displayName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
      userType: u.userType || 'customer',
      status: u.status || 'active',
      isApproved: u.isApproved,
      walletBalance: u.walletBalance,
    };
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Real platform stats (server-side, admin-checked).
      const s = await runCloudFunction<AdminStats>('getAdminStats', {});
      setStats({ ...ZERO, ...s });

      // Pending tradie approvals.
      const pendingSnap = await getDocs(
        query(collection(db, 'users'), where('userType', '==', 'tradie'), where('isApproved', '==', false), limit(25))
      );
      setPending(pendingSnap.docs.map(mapUser));

      // Recent users.
      const recentSnap = await getDocs(
        query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20))
      );
      setRecentUsers(recentSnap.docs.map(mapUser));
    } catch (e: any) {
      showAlert('Error', e?.message || 'Failed to load admin data', undefined, { tone: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (userId: string, approved: boolean) => {
    setBusyId(userId);
    try {
      await runCloudFunction('adminSetTradieApproval', { userId, approved });
      await load();
    } catch (e: any) {
      showAlert('Error', e?.message || 'Action failed', undefined, { tone: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (userId: string, status: 'active' | 'suspended') => {
    setBusyId(userId);
    try {
      await runCloudFunction('adminSetUserStatus', { userId, status });
      await load();
    } catch (e: any) {
      showAlert('Error', e?.message || 'Action failed', undefined, { tone: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage users and monitor the platform</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={load}>
            <RefreshCw size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={signOut}>
            <LogOut size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatBox label="Total Users" value={stats.totalUsers} color={theme.colors.primary} />
            <StatBox label="Customers" value={stats.totalCustomers} color="#2563eb" />
            <StatBox label="Tradies" value={stats.totalTradies} color="#059669" />
            <StatBox label="Pending Approvals" value={stats.pendingApprovals} color="#d97706" />
          </View>

          {/* Financials */}
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.card}>
            <View style={styles.finRow}>
              <View style={styles.finItem}>
                <Wallet size={16} color={theme.colors.success} />
                <Text style={styles.finLabel}>Unlock Revenue</Text>
                <Text style={[styles.finValue, { color: theme.colors.success }]}>{formatCurrency(stats.totalRevenue)}</Text>
              </View>
              <View style={styles.finItem}>
                <Users size={16} color={theme.colors.primary} />
                <Text style={styles.finLabel}>Total Unlocks</Text>
                <Text style={styles.finValue}>{stats.totalUnlocks}</Text>
              </View>
              <View style={styles.finItem}>
                <Text style={styles.finLabel}>Avg / Unlock</Text>
                <Text style={styles.finValue}>
                  {formatCurrency(stats.totalUnlocks > 0 ? stats.totalRevenue / stats.totalUnlocks : 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Pending approvals */}
          <Text style={styles.sectionTitle}>Pending Tradie Approvals ({pending.length})</Text>
          {pending.length === 0 ? (
            <Text style={styles.empty}>No tradies awaiting approval.</Text>
          ) : (
            pending.map((u) => (
              <View key={u.id} style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.displayName}</Text>
                  <Text style={styles.userMeta}>Tradie • awaiting approval</Text>
                </View>
                <View style={styles.rowActions}>
                  {busyId === u.id ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <>
                      <TouchableOpacity style={[styles.actionPill, styles.approvePill]} onPress={() => approve(u.id, true)}>
                        <CheckCircle2 size={14} color="#fff" />
                        <Text style={styles.approveText}>Approve</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}

          {/* Recent users + management */}
          <Text style={styles.sectionTitle}>Users</Text>
          {recentUsers.map((u) => {
            const suspended = u.status === 'suspended';
            return (
              <View key={u.id} style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.displayName}</Text>
                  <Text style={styles.userMeta}>
                    {u.userType}{u.userType === 'tradie' && u.walletBalance != null ? ` • ${formatCurrency(u.walletBalance)}` : ''}
                    {suspended ? ' • suspended' : ''}
                  </Text>
                </View>
                <View style={styles.rowActions}>
                  {busyId === u.id ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : u.userType === 'admin' ? null : suspended ? (
                    <TouchableOpacity style={[styles.actionPill, styles.activatePill]} onPress={() => setStatus(u.id, 'active')}>
                      <ShieldCheck size={14} color={theme.colors.success} />
                      <Text style={[styles.actionPillText, { color: theme.colors.success }]}>Reactivate</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.actionPill, styles.suspendPill]} onPress={() => setStatus(u.id, 'suspended')}>
                      <ShieldOff size={14} color={theme.colors.error} />
                      <Text style={[styles.actionPillText, { color: theme.colors.error }]}>Suspend</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, maxWidth: 900, width: '100%', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: Platform.OS === 'web' ? 26 : 22, fontWeight: '700', color: theme.colors.text.primary },
  subtitle: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border.light, justifyContent: 'center', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statBox: {
    flexGrow: 1, flexBasis: '47%', backgroundColor: theme.colors.surface, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: theme.colors.border.light,
  },
  statValue: { fontSize: 26, fontWeight: '700' },
  statLabel: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginTop: 8, marginBottom: 12 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border.light, marginBottom: 12 },
  finRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  finItem: { flexGrow: 1, flexBasis: '28%' },
  finLabel: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 4 },
  finValue: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginTop: 2 },
  empty: { fontSize: 13, color: theme.colors.text.tertiary, marginBottom: 12 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: theme.colors.border.light,
  },
  userInfo: { flex: 1, marginRight: 8 },
  userName: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  userMeta: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2, textTransform: 'capitalize' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  approvePill: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  approveText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  activatePill: { borderColor: theme.colors.success, backgroundColor: theme.colors.surface },
  suspendPill: { borderColor: theme.colors.error, backgroundColor: theme.colors.surface },
  actionPillText: { fontSize: 13, fontWeight: '600' },
});
