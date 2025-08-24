import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { useAuth } from '../../context/AuthContext';
import { phoneProvider, signInWithPhoneCredential } from '../../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Customer, Tradie } from '../../types';

interface LoginScreenProps {
  userType: 'customer' | 'tradie';
  onNavigateToSignup: () => void;
}

export default function LoginScreen({ userType, onNavigateToSignup }: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { firebaseUser } = useAuth();

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Format phone number for Firebase (add +1 for US, adjust for your country)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
      
      const confirmation = await phoneProvider.verifyPhoneNumber(formattedPhone);
      // Type assertion to access verificationId
      const conf = confirmation as any;
      if (conf && conf.verificationId) {
        setVerificationId(conf.verificationId);
        setIsOtpSent(true);
        Alert.alert('Success', 'OTP sent successfully!');
      } else {
        throw new Error('Invalid confirmation result from Firebase');
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPhoneCredential(verificationId, otp);
      
      if (result.user) {
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        
        if (!userDoc.exists()) {
          // Create new user document
          const userData = {
            id: result.user.uid,
            phoneNumber: phoneNumber,
            userType: userType,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...(userType === 'customer' ? {
              firstName: '',
              lastName: '',
              email: '',
              address: ''
            } : {
              firstName: '',
              lastName: '',
              businessName: '',
              licenseNumber: '',
              insuranceDetails: {
                provider: '',
                policyNumber: '',
                expiryDate: new Date(),
                coverageAmount: 0
              },
              interestedSuburbs: [],
              interestedTrades: [],
              rating: 0,
              totalJobs: 0,
              walletBalance: 0,
              isApproved: false
            })
          };
          
          await setDoc(doc(db, 'users', result.user.uid), userData);
        }
        
        Alert.alert('Success', 'Login successful!');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setIsOtpSent(false);
    setOtp('');
    handleSendOTP();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Welcome Back
        </Text>
        
        <Text style={styles.subtitle}>
          Sign in to your {userType} account
        </Text>

        <Input
          label="Phone Number"
          placeholder="Enter your phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          isRequired
        />

        {!isOtpSent ? (
          <Button
            title="Send OTP"
            onPress={handleSendOTP}
            loading={loading}
            fullWidth
            style={styles.button}
          />
        ) : (
          <>
            <Input
              label="OTP Code"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              isRequired
            />

            <Button
              title="Verify OTP"
              onPress={handleVerifyOTP}
              loading={loading}
              fullWidth
              style={styles.button}
            />

            <Button
              title="Resend OTP"
              onPress={handleResendOTP}
              variant="outline"
              fullWidth
              style={styles.button}
            />
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text style={styles.linkText} onPress={onNavigateToSignup}>
              Sign up
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 32,
  },
  button: {
    marginTop: 16,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#6b7280',
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
