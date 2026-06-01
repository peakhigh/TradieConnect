import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { SimpleButton } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { useAuth } from '../../context/AuthContext';
import { useSave } from '../../hooks/useSave';
import { theme } from '../../theme/theme';
import { User, X } from 'lucide-react-native';
import { useScreenNavigation } from '../../navigation/NavigationContext';

export default function CustomerProfileScreen() {
  const { user, signOut, setUser } = useAuth();
  const navigation = useScreenNavigation();
  const { updateDocument, loading: saving } = useSave('users');
  const [editing, setEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: (user as any)?.firstName || '',
    lastName: (user as any)?.lastName || '',
    email: (user as any)?.email || '',
    phoneNumber: (user as any)?.phoneNumber || '',
  });

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDocument(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });

      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
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
    : 'Customer';

  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <Container scrollable={false} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Avatar + Name */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.userType}>Customer</Text>
          </View>

          {/* Profile Fields */}
          {editing ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Edit Profile</Text>

              <Input
                label="First Name"
                value={formData.firstName}
                onChangeText={(value: string) => setFormData(prev => ({ ...prev, firstName: value }))}
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChangeText={(value: string) => setFormData(prev => ({ ...prev, lastName: value }))}
              />
              <Input
                label="Email"
                value={formData.email}
                onChangeText={(value: string) => setFormData(prev => ({ ...prev, email: value }))}
                keyboardType="email-address"
              />
              <Input
                label="Phone"
                value={formData.phoneNumber}
                editable={false}
                style={styles.disabledInput}
              />

              <View style={styles.editActions}>
                <SimpleButton
                  title="Cancel"
                  onPress={() => {
                    setEditing(false);
                    setFormData({
                      firstName: (user as any)?.firstName || '',
                      lastName: (user as any)?.lastName || '',
                      email: (user as any)?.email || '',
                      phoneNumber: (user as any)?.phoneNumber || '',
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
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.profileView}>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>First Name</Text>
                  <Text style={styles.profileValue}>{(user as any)?.firstName || 'Not set'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Last Name</Text>
                  <Text style={styles.profileValue}>{(user as any)?.lastName || 'Not set'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Email</Text>
                  <Text style={styles.profileValue}>{(user as any)?.email || 'Not set'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Phone</Text>
                  <Text style={styles.profileValue}>{(user as any)?.phoneNumber || 'Not set'}</Text>
                </View>
              </View>

              <SimpleButton
                title="Edit Profile"
                onPress={() => setEditing(true)}
                style={styles.editButton}
              />
            </View>
          )}

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
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: 16,
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
  disabledInput: {
    backgroundColor: theme.colors.surfaceSecondary,
    color: theme.colors.text.secondary,
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
