import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User, LogOut, Mail, Phone, Building, Award, Wallet, X } from 'lucide-react-native';

export default function TradieProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    businessName: user?.businessName || '',
    licenseNumber: user?.licenseNumber || '',
  });

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        businessName: formData.businessName,
        licenseNumber: formData.licenseNumber,
        updatedAt: new Date(),
      });
      
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={40} color="#6b7280" />
          </View>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userType}>Tradie</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user?.totalJobs || 0}</Text>
              <Text style={styles.statLabel}>Jobs</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>${user?.walletBalance?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.statLabel}>Wallet</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Input
            label={<><User size={16} color="#4b5563" /> First Name</>}
            value={formData.firstName}
            onChangeText={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
            editable={editing}
            style={!editing && styles.disabledInput}
          />

          <Input
            label={<><User size={16} color="#4b5563" /> Last Name</>}
            value={formData.lastName}
            onChangeText={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
            editable={editing}
            style={!editing && styles.disabledInput}
          />

          <Input
            label={<><Mail size={16} color="#4b5563" /> Email</>}
            value={formData.email}
            editable={false}
            style={styles.disabledInput}
          />

          <Input
            label={<><Phone size={16} color="#4b5563" /> Phone Number</>}
            value={formData.phoneNumber}
            onChangeText={(value) => setFormData(prev => ({ ...prev, phoneNumber: value }))}
            editable={editing}
            style={!editing && styles.disabledInput}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <Input
            label={<><Building size={16} color="#4b5563" /> Business Name</>}
            value={formData.businessName}
            onChangeText={(value) => setFormData(prev => ({ ...prev, businessName: value }))}
            editable={editing}
            style={!editing && styles.disabledInput}
          />

          <Input
            label={<><Award size={16} color="#4b5563" /> License Number</>}
            value={formData.licenseNumber}
            onChangeText={(value) => setFormData(prev => ({ ...prev, licenseNumber: value }))}
            editable={editing}
            style={!editing && styles.disabledInput}
          />
        </View>

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
                    businessName: user?.businessName || '',
                    licenseNumber: user?.licenseNumber || '',
                  });
                }}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="Save"
                onPress={handleSave}
                loading={loading}
                style={styles.actionButton}
              />
            </View>
          ) : (
            <Button
              title="Edit Profile"
              onPress={() => setEditing(true)}
              style={styles.actionButton}
            />
          )}

          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={[styles.actionButton, styles.logoutButton]}
            leftIcon={<LogOut size={16} color="#dc2626" />}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
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
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
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
  logoutButton: {
    borderColor: '#dc2626',
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