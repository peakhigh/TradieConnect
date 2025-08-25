import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User, LogOut, Mail, Phone, MapPin, X } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { ProjectLoader } from '../../components/UI/ProjectLoader';

export default function CustomerProfileScreen() {
  const { user, signOut, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    streetAddress: user?.streetAddress || '',
    suburb: user?.suburb || '',
    state: user?.state || '',
    postcode: user?.postcode || '',
  });

  // Check if profile is incomplete (only has phone number)
  const isProfileIncomplete = !user?.firstName && !user?.lastName && !user?.email && !user?.suburb;

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        streetAddress: formData.streetAddress,
        suburb: formData.suburb,
        state: formData.state,
        postcode: formData.postcode,
        updatedAt: new Date(),
      });
      
      // Update user in localStorage and context for web persistence
      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        streetAddress: formData.streetAddress,
        suburb: formData.suburb,
        state: formData.state,
        postcode: formData.postcode,
      };
      
      // Update localStorage if on web
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('tradieapp_user', JSON.stringify(updatedUser));
      }
      
      // Update user in auth context immediately
      setUser(updatedUser);
      
      Alert.alert('Success', 'Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
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

  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={40} color="#6b7280" />
          </View>
          <Text style={styles.name}>
            {user?.firstName || user?.lastName ? `${user?.firstName} ${user?.lastName}` : 'Welcome!'}
          </Text>
          <Text style={styles.userType}>Customer</Text>
        </View>

        {isProfileIncomplete && !editing ? (
          <View style={styles.setupSection}>
            <Text style={styles.setupTitle}>Complete Your Profile</Text>
            <Text style={styles.setupSubtitle}>
              Add your details to get started with TradieConnect
            </Text>
            <Button
              title="Setup Profile"
              onPress={() => setEditing(true)}
              style={styles.setupButton}
            />
          </View>
        ) : editing ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            
            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
            />

            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
            />

            <Input
              label="Email"
              value={formData.email}
              onChangeText={(value) => setFormData(prev => ({ ...prev, email: value }))}
              keyboardType="email-address"
            />

            <Input
              label="Phone Number"
              value={formData.phoneNumber}
              editable={false}
              style={styles.disabledInput}
            />

            <Input
              label="Street Address"
              value={formData.streetAddress}
              onChangeText={(value) => setFormData(prev => ({ ...prev, streetAddress: value }))}
              placeholder="123 Main Street"
            />

            <Input
              label="Suburb"
              value={formData.suburb}
              onChangeText={(value) => setFormData(prev => ({ ...prev, suburb: value }))}
              placeholder="Sydney"
            />

            <View style={styles.addressRow}>
              <View style={styles.addressField}>
                <Input
                  label="State"
                  value={formData.state}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, state: value }))}
                  placeholder="NSW"
                />
              </View>
              <View style={styles.addressField}>
                <Input
                  label="Postcode"
                  value={formData.postcode}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, postcode: value }))}
                  placeholder="2000"
                  keyboardType="numeric"
                />
              </View>
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
                <Text style={styles.profileLabel}>Phone Number</Text>
                <Text style={styles.profileValue}>{user?.phoneNumber}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Street Address</Text>
                <Text style={styles.profileValue}>{user?.streetAddress || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Suburb</Text>
                <Text style={styles.profileValue}>{user?.suburb || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>State</Text>
                <Text style={styles.profileValue}>{user?.state || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Postcode</Text>
                <Text style={styles.profileValue}>{user?.postcode || 'Not set'}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {editing ? (
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setEditing(false);
                  setFormData({
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    email: user?.email || '',
                    phoneNumber: user?.phoneNumber || '',
                    streetAddress: user?.streetAddress || '',
                    suburb: user?.suburb || '',
                    state: user?.state || '',
                    postcode: user?.postcode || '',
                  });
                }}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="Save Profile"
                onPress={handleSave}
                loading={loading}
                style={styles.actionButton}
              />
            </View>
          ) : (
            !isProfileIncomplete && (
              <Button
                title="Edit Profile"
                onPress={() => setEditing(true)}
                style={styles.actionButton}
              />
            )
          )}

          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.actionButton}
          />
        </View>

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
                <Button
                  title="Cancel"
                  onPress={() => setShowLogoutModal(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
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
      {loading && <ProjectLoader message="Updating profile..." />}
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
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userType: {
    fontSize: 16,
    color: '#6b7280',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  actions: {
    gap: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  setupSection: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  setupButton: {
    minWidth: 200,
  },
  profileView: {
    gap: 16,
  },
  profileItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '400',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressField: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
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
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalText: {
    fontSize: 16,
    color: '#6b7280',
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