import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Container } from '../components/UI/Container';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useSave } from '../hooks/useSave';
import { runCloudFunction } from '../services/cloudFunctions';
import { Bell, MessageCircle, DollarSign, Trash2, AlertTriangle } from 'lucide-react-native';

interface NotificationPrefs {
  push: boolean;
  chat: boolean;
  quotes: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = { push: true, chat: true, quotes: true };

export default function SettingsScreen() {
  const { user, setUser, signOut } = useAuth();
  const { updateDocument } = useSave('users');

  const initial: NotificationPrefs = { ...DEFAULT_PREFS, ...((user as any)?.notificationPrefs || {}) };
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePref = async (key: keyof NotificationPrefs) => {
    if (!user) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingKey(key);
    try {
      await updateDocument(user.id, { notificationPrefs: next });
      setUser({ ...user, notificationPrefs: next } as any);
    } catch (e) {
      // Revert on failure.
      setPrefs(prefs);
    } finally {
      setSavingKey(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await runCloudFunction('deleteUserData', {});
      await signOut();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const rows: { key: keyof NotificationPrefs; icon: any; label: string; sub: string }[] = [
    { key: 'push', icon: Bell, label: 'Push notifications', sub: 'Alerts on your device' },
    { key: 'chat', icon: MessageCircle, label: 'Messages', sub: 'New chat messages' },
    { key: 'quotes', icon: DollarSign, label: 'Quotes & jobs', sub: 'Quote and job updates' },
  ];

  return (
    <Container scrollable={false} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          {rows.map((r, i) => {
            const Icon = r.icon;
            return (
              <View key={r.key} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
                <View style={styles.iconCircle}><Icon size={18} color={theme.colors.primary} /></View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{r.label}</Text>
                  <Text style={styles.rowSub}>{r.sub}</Text>
                </View>
                {savingKey === r.key ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Switch
                    value={prefs[r.key]}
                    onValueChange={() => togglePref(r.key)}
                    trackColor={{ true: theme.colors.primary }}
                  />
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dangerRow} onPress={() => { setError(null); setShowDelete(true); }}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Trash2 size={18} color={theme.colors.error} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: theme.colors.error }]}>Delete account</Text>
              <Text style={styles.rowSub}>Permanently remove your account</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.appVersion}>TradieConnect v1.0.0</Text>
      </ScrollView>

      {/* Delete confirmation */}
      <Modal visible={showDelete} transparent animationType="fade" onRequestClose={() => !deleting && setShowDelete(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !deleting && setShowDelete(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2', width: 48, height: 48, borderRadius: 24 }]}>
                <AlertTriangle size={24} color={theme.colors.error} />
              </View>
            </View>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalSubtitle}>
              This permanently removes your profile and signs you out. This cannot be undone.
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.goBackBtn} onPress={() => setShowDelete(false)} disabled={deleting}>
                <Text style={styles.goBackText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, deleting && { opacity: 0.6 }]} onPress={handleDelete} disabled={deleting}>
                {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 8, marginTop: 8 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border.light },
  dangerRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500', color: theme.colors.text.primary },
  rowSub: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  appVersion: { fontSize: 12, color: theme.colors.text.tertiary, textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  modalIconRow: { alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  errorText: { fontSize: 13, color: theme.colors.error, textAlign: 'center', marginBottom: 12 },
  modalButtonRow: { flexDirection: 'row', gap: 12 },
  goBackBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#FFF' },
  goBackText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.error },
  confirmText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
