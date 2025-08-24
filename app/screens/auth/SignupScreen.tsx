import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';

interface SignupScreenProps {
  userType: 'customer' | 'tradie';
  onNavigateToLogin: () => void;
}

export default function SignupScreen({ userType, onNavigateToLogin }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    // Tradie specific fields
    businessName: '',
    licenseNumber: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '',
    coverageAmount: '',
    interestedSuburbs: '',
    interestedTrades: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (userType === 'tradie') {
      if (!formData.licenseNumber || !formData.insuranceProvider || !formData.insurancePolicyNumber) {
        Alert.alert('Error', 'Please fill in all required tradie fields');
        return;
      }
    }

    setLoading(true);
    try {
      // TODO: Implement signup logic
      // Create user document in Firestore
      // Send verification SMS
      
      Alert.alert('Success', 'Account created successfully! Please verify your phone number.');
      onNavigateToLogin();
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Create Account
        </Text>
        
        <Text style={styles.subtitle}>
          Sign up as a {userType}
        </Text>

        <Input
          label="First Name *"
          placeholder="Enter your first name"
          value={formData.firstName}
          onChangeText={(value) => handleInputChange('firstName', value)}
        />

        <Input
          label="Last Name *"
          placeholder="Enter your last name"
          value={formData.lastName}
          onChangeText={(value) => handleInputChange('lastName', value)}
        />

        <Input
          label="Phone Number *"
          placeholder="Enter your phone number"
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange('phoneNumber', value)}
          keyboardType="phone-pad"
        />

        <Input
          label="Email (Optional)"
          placeholder="Enter your email"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Address (Optional)"
          placeholder="Enter your address"
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
        />

        {userType === 'tradie' && (
          <>
            <Input
              label="Business Name (Optional)"
              placeholder="Enter your business name"
              value={formData.businessName}
              onChangeText={(value) => handleInputChange('businessName', value)}
            />

            <Input
              label="License Number *"
              placeholder="Enter your license number"
              value={formData.licenseNumber}
              onChangeText={(value) => handleInputChange('licenseNumber', value)}
            />

            <Input
              label="Insurance Provider *"
              placeholder="Enter insurance provider"
              value={formData.insuranceProvider}
              onChangeText={(value) => handleInputChange('insuranceProvider', value)}
            />

            <Input
              label="Insurance Policy Number *"
              placeholder="Enter policy number"
              value={formData.insurancePolicyNumber}
              onChangeText={(value) => handleInputChange('insurancePolicyNumber', value)}
            />

            <Input
              label="Insurance Expiry Date *"
              placeholder="MM/DD/YYYY"
              value={formData.insuranceExpiryDate}
              onChangeText={(value) => handleInputChange('insuranceExpiryDate', value)}
            />

            <Input
              label="Coverage Amount *"
              placeholder="Enter coverage amount"
              value={formData.coverageAmount}
              onChangeText={(value) => handleInputChange('coverageAmount', value)}
              keyboardType="numeric"
            />

            <Input
              label="Interested Suburbs *"
              placeholder="e.g., Sydney, Melbourne, Brisbane"
              value={formData.interestedSuburbs}
              onChangeText={(value) => handleInputChange('interestedSuburbs', value)}
            />

            <Input
              label="Interested Trades *"
              placeholder="e.g., Plumbing, Electrical, Carpentry"
              value={formData.interestedTrades}
              onChangeText={(value) => handleInputChange('interestedTrades', value)}
            />
          </>
        )}

        <Button
          title="Create Account"
          onPress={handleSignup}
          loading={loading}
          style={styles.createButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text 
              style={styles.linkText}
              onPress={onNavigateToLogin}
            >
              Sign in
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 32,
  },
  createButton: {
    marginTop: 20,
  },
  footer: {
    marginTop: 32,
  },
  footerText: {
    textAlign: 'center',
    color: '#6b7280',
  },
  linkText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
