/**
 * SavedSearchesDrawer — right-sliding drawer for a tradie's job alerts.
 *
 * Lets a tradie:
 *  - Save the current Explorer filter combo as a named alert.
 *  - See existing saved searches, toggle each on/off, and delete them.
 *
 * When an alert is active, the onServiceRequestCreated Cloud Function pushes a
 * job alert to the tradie whenever a matching request is posted.
 *
 * Cross-platform (iOS, Android, Web). Slides in from the right per UI rules.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  TextInput,
  Switch,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { X, Bell, Trash2, Plus } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import {
  SavedSearch,
  fetchSavedSearches,
  createSavedSearch,
  toggleSavedSearch,
  deleteSavedSearch,
} from '../../services/savedSearchesService';

interface CurrentFilters {
  trades: string[];
  suburbs: string[]; // postcodes
  urgency: string[];
}

interface SavedSearchesDrawerProps {
  visible: boolean;
  onClose: () => void;
  tradieId: string;
  /** Current Explorer filters, used to prefill a new alert. */
  currentFilters: CurrentFilters;
}

const DRAWER_WIDTH = Math.min(420, Dimensions.get('window').width);

export const SavedSearchesDrawer: React.FC<SavedSearchesDrawerProps> = ({
  visible,
  onClose,
  tradieId,
  currentFilters,
}) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    if (!tradieId) return;
    setLoading(true);
    const data = await fetchSavedSearches(tradieId);
    setSearches(data);
    setLoading(false);
  }, [tradieId]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
    if (visible) {
      load();
      // Default name derived from the current trade filters.
      const suggested =
        currentFilters.trades.length > 0
          ? `${currentFilters.trades.map(cap).join(', ')}${
              currentFilters.suburbs.length ? ` · ${currentFilters.suburbs.join(', ')}` : ''
            }`
          : '';
      setName(suggested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const hasFilters =
    currentFilters.trades.length > 0 ||
    currentFilters.suburbs.length > 0 ||
    currentFilters.urgency.length > 0;

  const handleSave = async () => {
    if (!hasFilters || saving) return;
    setSaving(true);
    try {
      await createSavedSearch(tradieId, {
        name: name.trim() || 'Job alert',
        trades: currentFilters.trades,
        suburbs: currentFilters.suburbs,
        urgency: currentFilters.urgency,
        active: true,
      });
      setName('');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (search: SavedSearch) => {
    // Optimistic UI.
    setSearches((prev) =>
      prev.map((s) => (s.id === search.id ? { ...s, active: !s.active } : s))
    );
    try {
      await toggleSavedSearch(search.id, !search.active);
    } catch {
      await load(); // revert on failure
    }
  };

  const handleDelete = async (search: SavedSearch) => {
    setSearches((prev) => prev.filter((s) => s.id !== search.id));
    try {
      await deleteSavedSearch(search.id);
    } catch {
      await load();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.drawer, { right: 0, transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Bell size={18} color={theme.colors.primary} />
              <Text style={styles.title}>Job Alerts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Save current filters */}
            <View style={styles.saveCard}>
              <Text style={styles.saveCardTitle}>Save current filters as an alert</Text>
              {hasFilters ? (
                <>
                  <View style={styles.chipRow}>
                    {currentFilters.trades.map((t) => (
                      <View key={`t-${t}`} style={[styles.chip, styles.tradeChip]}>
                        <Text style={styles.tradeChipText}>{cap(t)}</Text>
                      </View>
                    ))}
                    {currentFilters.suburbs.map((s) => (
                      <View key={`s-${s}`} style={[styles.chip, styles.suburbChip]}>
                        <Text style={styles.suburbChipText}>{s}</Text>
                      </View>
                    ))}
                    {currentFilters.urgency.map((u) => (
                      <View key={`u-${u}`} style={[styles.chip, styles.urgencyChip]}>
                        <Text style={styles.urgencyChipText}>{cap(u)}</Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Alert name"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={name}
                    onChangeText={setName}
                  />
                  <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Plus size={16} color="#FFF" />
                        <Text style={styles.saveBtnText}>Create Alert</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.hintText}>
                  Apply some filters in the Explorer (trade, postcode, urgency), then come back here
                  to save them as an alert.
                </Text>
              )}
            </View>

            {/* Existing alerts */}
            <Text style={styles.listHeader}>Your alerts</Text>
            {loading ? (
              <ActivityIndicator style={{ marginTop: 16 }} color={theme.colors.primary} />
            ) : searches.length === 0 ? (
              <Text style={styles.emptyText}>
                No alerts yet. Save your filters above to get notified when matching jobs are posted.
              </Text>
            ) : (
              searches.map((s) => (
                <View key={s.id} style={styles.alertCard}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.alertMeta} numberOfLines={1}>
                      {s.trades.map(cap).join(', ') || 'Any trade'}
                      {s.suburbs.length ? ` · ${s.suburbs.join(', ')}` : ''}
                      {s.urgency.length ? ` · ${s.urgency.map(cap).join(', ')}` : ''}
                    </Text>
                  </View>
                  <Switch
                    value={s.active}
                    onValueChange={() => handleToggle(s)}
                    trackColor={{ true: theme.colors.primary, false: '#D1D5DB' }}
                  />
                  <TouchableOpacity onPress={() => handleDelete(s)} style={styles.deleteBtn}>
                    <Trash2 size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary },
  closeButton: { padding: 4 },
  content: { flex: 1, padding: 20 },
  saveCard: {
    backgroundColor: theme.colors.surfaceTertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  saveCardTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tradeChip: { backgroundColor: '#dcfce7' },
  tradeChipText: { color: '#166534', fontSize: theme.fontSize.xs, fontWeight: '600' },
  suburbChip: { backgroundColor: '#dbeafe' },
  suburbChipText: { color: '#1e40af', fontSize: theme.fontSize.xs, fontWeight: '600' },
  urgencyChip: { backgroundColor: '#fef3c7' },
  urgencyChipText: { color: '#92400e', fontSize: theme.fontSize.xs, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  hintText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  listHeader: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: 10,
  },
  alertInfo: { flex: 1 },
  alertName: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.text.primary },
  alertMeta: { fontSize: theme.fontSize.xs, color: theme.colors.text.secondary, marginTop: 2 },
  deleteBtn: { padding: 6 },
});
