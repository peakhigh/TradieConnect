import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SimpleButton } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { TradeSelector } from '../../components/UI/TradeSelector';
import { useAuth } from '../../context/AuthContext';
import { useSave } from '../../hooks/useSave';
import { theme } from '../../theme/theme';
import { Star, Briefcase, Settings, HelpCircle, X } from 'lucide-react-native';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { useAlert } from '../../components/UI/AlertProvider';

export default function TradieProfileScreen() {
  const { user, signOut, setUser } = useAuth();
  const navigation = useScreenNavigation();
  const { showAlert } = useAlert();
  const { updateDocument, loading: saving } = useSave('users');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    businessName: (user as any)?.businessName || '',
    licenceNumber: (user as any)?.licenceDetails?.licenceNumber || (user as any)?.licenseNumber || '',
  });
  const [editTrades, setEditTrades] = useState<string[]>(
    (user as any)?.interestedTrades || (user as any)?.trades || []
  );
  const [editSuburbs, setEditSuburbs] = useState<string[]>(
    (user as any)?.interestedSuburbs || (user as any)?.suburbs || []
  );
  const [newSuburb, setNewSuburb] = useState('');

  const addSuburb = () => {
    const s = newSuburb.trim();
    if (s && !editSuburbs.includes(s)) {
      setEditSuburbs([...editSuburbs, s]);
    }
    setNewSuburb('');
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const updates = {
        businessName: formData.businessName,
        licenceDetails: {
          ...((user as any)?.licenceDetails || {}),
          licenceNumber: formData.licenceNumber,
        },
        interestedTrades: editTrades,
        interestedSuburbs: editSuburbs,
      };
      await updateDocument(user.id, updates);
      setUser({ ...user, ...updates } as any);
      setEditing(false);
      showAlert('Success', 'Profile updated successfully!', undefined, { tone: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Error', 'Failed to update profile', undefined, { tone: 'destructive' });
    }
  };

  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: confirmLogout },
      ],
      { tone: 'destructive' }
    );
  };

  const confirmLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const displayName = (user as any)?.firstName || (user as any)?.lastName
    ? `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim()
    : 'Tradie';

  const avatarLetter = displayName.charAt(0).toUpperCase();
  const rating = (user as any)?.rating ?? 0;
  const totalJobs = (user as any)?.totalJobs ?? 0;
  const trades: string[] = (user as any)?.interestedTrades || (user as any)?.trades || [];
  const suburbs: string[] = (user as any)?.interestedSuburbs || (user as any)?.suburbs || [];

  return (
    <Container scrollable={false} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Avatar + Name + Stats */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Star size={14} color={theme.colors.warning} />
                <Text style={styles.statText}>{rating.toFixed(1)}</Text>
              </View>
              <View style={styles.statItem}>
                <Briefcase size={14} color={theme.colors.primary} />
                <Text style={styles.statText}>{totalJobs} jobs</Text>
              </View>
            </View>
          </View>

          {/* Editable Fields */}
          {editing ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Edit Details</Text>

              <Input
                label="Business Name"
                value={formData.businessName}
                onChangeText={(value: string) => setFormData(prev => ({ ...prev, businessName: value }))}
              />
              <Input
                label="Licence Number"
                value={formData.licenceNumber}
                onChangeText={(value: string) => setFormData(prev => ({ ...prev, licenceNumber: value }))}
              />

              <Text style={styles.editLabel}>Trades</Text>
              <TradeSelector selectedTrades={editTrades} onTradesChange={setEditTrades} />

              <Text style={styles.editLabel}>Service Suburbs (postcodes)</Text>
              <View style={styles.suburbInputRow}>
                <TextInput
                  style={styles.suburbInput}
                  value={newSuburb}
                  onChangeText={setNewSuburb}
                  placeholder="e.g. 2026"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="number-pad"
                  onSubmitEditing={addSuburb}
                />
                <TouchableOpacity style={styles.addSuburbBtn} onPress={addSuburb}>
                  <Text style={styles.addSuburbBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagContainer}>
                {editSuburbs.map((s) => (
                  <TouchableOpacity key={s} style={[styles.tag, styles.suburbTag]} onPress={() => setEditSuburbs(editSuburbs.filter((x) => x !== s))}>
                    <Text style={styles.suburbTagText}>{s}</Text>
                    <X size={12} color="#1e40af" />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editActions}>
                <SimpleButton
                  title="Cancel"
                  onPress={() => {
                    setEditing(false);
                    setFormData({
                      businessName: (user as any)?.businessName || '',
                      licenceNumber: (user as any)?.licenceDetails?.licenceNumber || (user as any)?.licenseNumber || '',
                    });
                    setEditTrades((user as any)?.interestedTrades || (user as any)?.trades || []);
                    setEditSuburbs((user as any)?.interestedSuburbs || (user as any)?.suburbs || []);
                  }}
                  variant="outline"
                  style={styles.actionButton}
                />
                <SimpleButton
                  title="Save"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.actionButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Details</Text>

              <View style={styles.profileView}>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Business Name</Text>
                  <Text style={styles.profileValue}>{(user as any)?.businessName || 'Not set'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Licence Number</Text>
                  <Text style={styles.profileValue}>
                    {(user as any)?.licenceDetails?.licenceNumber || (user as any)?.licenseNumber || 'Not set'}
                  </Text>
                </View>
              </View>

              <SimpleButton
                title="Edit Details"
                onPress={() => setEditing(true)}
                style={styles.editButton}
              />
            </View>
          )}

          {/* Trades */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trades</Text>
            {trades.length > 0 ? (
              <View style={styles.tagContainer}>
                {trades.map((trade) => (
                  <View key={trade} style={[styles.tag, styles.tradeTag]}>
                    <Text style={styles.tradeTagText}>{trade}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No trades set</Text>
            )}
          </View>

          {/* Suburbs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Areas</Text>
            {suburbs.length > 0 ? (
              <View style={styles.tagContainer}>
                {suburbs.map((suburb) => (
                  <View key={suburb} style={[styles.tag, styles.suburbTag]}>
                    <Text style={styles.suburbTagText}>{suburb}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No suburbs set</Text>
            )}
          </View>

          {/* Settings & Help */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Settings')}>
              <Settings size={18} color={theme.colors.text.secondary} />
              <Text style={styles.linkRowText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Help')}>
              <HelpCircle size={18} color={theme.colors.text.secondary} />
              <Text style={styles.linkRowText}>Help & FAQ</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <SimpleButton
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium as any,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  profileView: {
    gap: 12,
  },
  profileItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  profileLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  editButton: {
    marginTop: 16,
  },
  editLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  suburbInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  suburbInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  addSuburbBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  addSuburbBtnText: { color: '#fff', fontWeight: '600' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  linkRowText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tradeTag: {
    backgroundColor: '#dcfce7',
  },
  tradeTagText: {
    color: '#166534',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
  },
  suburbTag: {
    backgroundColor: '#dbeafe',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suburbTagText: {
    color: '#1e40af',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: 8,
  },
});
