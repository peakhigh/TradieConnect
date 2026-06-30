import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SimpleButton } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { useAuth } from '../../context/AuthContext';
import { useSave } from '../../hooks/useSave';
import { theme } from '../../theme/theme';
import { Settings, HelpCircle } from 'lucide-react-native';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { useAlert } from '../../components/UI/AlertProvider';

export default function CustomerProfileScreen() {
  const { user, signOut, setUser } = useAuth();
  const navigation = useScreenNavigation();
  const { showAlert } = useAlert();
  const { updateDocument, loading: saving } = useSave('users');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: (user as any)?.address || '',
  });

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDocument(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        address: formData.address,
      });

      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        address: formData.address,
      };
      setUser(updatedUser as any);
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

  const displayName = user?.firstName || user?.lastName
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
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
                label="Address"
                value={formData.address}
                onChangeText={(value: string) => setFormData(prev => ({ ...prev, address: value }))}
                helperText="Shared with a tradie only when you accept their quote"
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
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || '',
                      phoneNumber: user?.phoneNumber || '',
                      address: (user as any)?.address || '',
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
                  <Text style={styles.profileValue}>{user?.firstName || 'Not set'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Last Name</Text>
                  <Text style={styles.profileValue}>{user?.lastName || 'Not set'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Email</Text>
                  <Text style={styles.profileValue}>{user?.email || 'Not set'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Phone</Text>
                  <Text style={styles.profileValue}>{user?.phoneNumber || 'Not set'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Address</Text>
                  <Text style={styles.profileValue}>{(user as any)?.address || 'Not set'}</Text>
                </View>
              </View>

              <SimpleButton
                title="Edit Profile"
                onPress={() => setEditing(true)}
                style={styles.editButton}
              />
            </View>
          )}

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
  logoutButton: {
    marginTop: 8,
  },
});
