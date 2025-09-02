import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Container } from '../../components/UI/Container';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, ArrowLeft, Edit3, X } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { ProjectLoader } from '../../components/UI/ProjectLoader';
import { useNavigation } from '@react-navigation/native';
import TradieOnboardingScreen from './TradieOnboardingScreen';
import { formatDate } from '../../utils/dateUtils';

export default function TradieProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleEditComplete = async () => {
    await refreshUser();
    setEditing(false);
  };

  if (editing) {
    return (
      <Modal visible={editing} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.editContainer}>
          <View style={styles.editHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setEditing(false)}
            >
              <ArrowLeft size={20} color={theme.colors.text.secondary} />
              <Text style={styles.backButtonText}>Back to Profile</Text>
            </TouchableOpacity>
          </View>
          <TradieOnboardingScreen 
            isEditMode={true}
            existingData={user}
            onComplete={handleEditComplete}
          />
        </View>
      </Modal>
    );
  }

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
            <Text style={styles.userType}>Tradie</Text>
            {user?.businessName && (
              <Text style={styles.businessName}>{user.businessName}</Text>
            )}
          </View>

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
                <Text style={styles.profileLabel}>Business Type</Text>
                <Text style={styles.profileValue}>
                  {user?.businessType === 'business' ? 'Business Owner' : 'Sole Trader'}
                </Text>
              </View>
            </View>
          </View>

          {user?.businessType === 'business' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Details</Text>
              
              <View style={styles.profileView}>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>ABN</Text>
                  <Text style={styles.profileValue}>{user?.abn || 'Not set'}</Text>
                </View>
                
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Business Name</Text>
                  <Text style={styles.profileValue}>{user?.businessName || 'Not set'}</Text>
                </View>
                
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Business Address</Text>
                  <Text style={styles.profileValue}>
                    {user?.businessAddress ? 
                      `${user.businessAddress.streetAddress}, ${user.businessAddress.suburb}, ${user.businessAddress.state} ${user.businessAddress.postcode}` 
                      : 'Not set'
                    }
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contractor Details</Text>
            
            <View style={styles.profileView}>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Licence Number</Text>
                <Text style={styles.profileValue}>{user?.licenceDetails?.licenceNumber || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Name on Licence</Text>
                <Text style={styles.profileValue}>{user?.licenceDetails?.nameOnLicence || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Licence Class</Text>
                <Text style={styles.profileValue}>{user?.licenceDetails?.licenceClass || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Licence Expiry</Text>
                <Text style={styles.profileValue}>
                  {formatDate(user?.licenceDetails?.licenceExpiry)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance Details</Text>
            
            <View style={styles.profileView}>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Policy Number</Text>
                <Text style={styles.profileValue}>{user?.insuranceDetails?.policyNumber || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Policy Holder Name</Text>
                <Text style={styles.profileValue}>{user?.insuranceDetails?.policyHolderName || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Expiry Date</Text>
                <Text style={styles.profileValue}>
                  {formatDate(user?.insuranceDetails?.expiryDate)}
                </Text>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Liability Limit</Text>
                <Text style={styles.profileValue}>{user?.insuranceDetails?.liabilityLimit || 'Not set'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Interests</Text>
            
            <View style={styles.profileView}>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Interested Suburbs</Text>
                <View style={styles.tagContainer}>
                  {(user?.interestedSuburbs || []).map((suburb: string) => (
                    <View key={suburb} style={[styles.tag, styles.suburbTag]}>
                      <Text style={styles.suburbTagText}>{suburb}</Text>
                    </View>
                  ))}
                  {(!user?.interestedSuburbs || user.interestedSuburbs.length === 0) && (
                    <Text style={styles.profileValue}>Not set</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Interested Trades</Text>
                <View style={styles.tagContainer}>
                  {(user?.interestedTrades || []).map((trade: string) => (
                    <View key={trade} style={[styles.tag, styles.tradeTag]}>
                      <Text style={styles.tradeTagText}>{trade}</Text>
                    </View>
                  ))}
                  {(!user?.interestedTrades || user.interestedTrades.length === 0) && (
                    <Text style={styles.profileValue}>Not set</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Edit Profile"
              onPress={() => setEditing(true)}
              style={styles.actionButton}
            />

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
  editContainer: {
    flex: 1,
  },
  editHeader: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
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
  businessName: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
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
  actions: {
    gap: 12,
  },
  actionButton: {
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
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  suburbTag: {
    backgroundColor: '#dbeafe',
  },
  suburbTagText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '500',
  },
  tradeTag: {
    backgroundColor: '#dcfce7',
  },
  tradeTagText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '500',
  },
});