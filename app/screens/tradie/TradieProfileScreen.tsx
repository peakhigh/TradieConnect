import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { SimpleButton } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { useAuth } from '../../context/AuthContext';
import { useSave } from '../../hooks/useSave';
import { theme } from '../../theme/theme';
import { User, Star, Briefcase, X } from 'lucide-react-native';
import { useScreenNavigation } from '../../navigation/NavigationContext';

export default function TradieProfileScreen() {
  const { user, signOut, setUser } = useAuth();
  const navigation = useScreenNavigation();
  const { updateDocument, loading: saving } = useSave('users');
  const [editing, setEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [formData, setFormData] = useState({
    businessName: (user as any)?.businessName || '',
    licenceNumber: (user as any)?.licenceDetails?.licenceNumber || (user as any)?.licenseNumber || '',
  });

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDocument(user.id, {
        businessName: formData.businessName,
        licenceDetails: {
          ...((user as any)?.licenceDetails || {}),
          licenceNumber: formData.licenceNumber,
        },
      });

      const updatedUser = {
        ...user,
        businessName: formData.businessName,
        licenceDetails: {
          ...((user as any)?.licenceDetails || {}),
          licenceNumber: formData.licenceNumber,
        },
      };
      setUser(updatedUser as any);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut();
      setShowLogoutModal(false);
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

              <View style={styles.editActions}>
                <SimpleButton
                  title="Cancel"
                  onPress={() => {
                    setEditing(false);
                    setFormData({
                      businessName: (user as any)?.businessName || '',
                      licenceNumber: (user as any)?.licenceDetails?.licenceNumber || (user as any)?.licenseNumber || '',
                    });
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

          {/* Logout */}
          <SimpleButton
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />

          {/* Logout Modal */}
          <Modal
            visible={showLogoutModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowLogoutModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Logout</Text>
                  <TouchableOpacity onPress={() => setShowLogoutModal(false)}>
                    <X size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalText}>Are you sure you want to logout?</Text>
                <View style={styles.modalButtons}>
                  <SimpleButton
                    title="Cancel"
                    onPress={() => setShowLogoutModal(false)}
                    variant="outline"
                    style={styles.modalButton}
                  />
                  <SimpleButton
                    title="Logout"
                    onPress={confirmLogout}
                    variant="danger"
                    style={styles.modalButton}
                  />
                </View>
              </View>
            </View>
          </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  modalText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
