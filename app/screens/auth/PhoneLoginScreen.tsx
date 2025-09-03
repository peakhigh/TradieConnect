import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet, Platform } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { useAuth } from '../../context/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useRoute, RouteProp } from '@react-navigation/native';
import { secureLog, secureError } from '../../utils/logger';

type RootStackParamList = {
  Login: { userType: 'customer' | 'tradie' };
};

type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

export default function PhoneLoginScreen() {
  const route = useRoute<LoginScreenRouteProp>();
  const userType = route.params?.userType || 'customer';
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [usePhoneAuth, setUsePhoneAuth] = useState(true);

  const handleAuth = async () => {
    if (usePhoneAuth) {
      if (!phoneNumber || phoneNumber.length < 10) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return;
      }
      
      // Simple phone auth simulation for development
      Alert.alert(
        'Phone Authentication',
        `Would you like to ${isSignup ? 'create account' : 'sign in'} with phone number ${phoneNumber}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Continue',
            onPress: async () => {
              setLoading(true);
              try {
                // For development, create a dummy email from phone number
                const dummyEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@phone.local`;
                const dummyPassword = 'phone123';
                
                let result;
                if (isSignup) {
                  result = await createUserWithEmailAndPassword(auth, dummyEmail, dummyPassword);
                  await createUserDocument(result.user.uid, phoneNumber, '');
                } else {
                  result = await signInWithEmailAndPassword(auth, dummyEmail, dummyPassword);
                }
                // Navigation will be handled automatically by AuthContext
              } catch (error: any) {
                if (error.code === 'auth/email-already-in-use' && isSignup) {
                  // Try to sign in instead
                  try {
                    const dummyEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@phone.local`;
                    const dummyPassword = 'phone123';
                    await signInWithEmailAndPassword(auth, dummyEmail, dummyPassword);
                    // Navigation will be handled automatically by AuthContext
                  } catch (signInError: any) {
                    Alert.alert('Error', 'Account exists but password is incorrect');
                  }
                } else {
                  Alert.alert('Error', error.message || 'Authentication failed');
                }
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (isSignup) {
        result = await createUserWithEmailAndPassword(auth, email, password);
        await createUserDocument(result.user.uid, phoneNumber, email);
        // Navigation will be handled automatically by AuthContext
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
        // Navigation will be handled automatically by AuthContext
      }
    } catch (error: any) {
      secureError('Auth error:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Account Exists', 
          'An account with this email already exists. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => setIsSignup(false) }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const createUserDocument = async (uid: string, phone: string, email: string) => {
    const userData = {
      id: uid,
      email: email,
      phoneNumber: phone,
      role: userType, // Use 'role' instead of 'userType'
      userType: userType, // Keep both for compatibility
      onboardingCompleted: userType === 'customer', // Customers don't need onboarding
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(userType === 'customer' ? {
        firstName: '',
        lastName: '',
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
        walletBalance: 10, // $10 signup bonus
        isApproved: false
      })
    };
    
    secureLog('Creating user document:', userData);
    await setDoc(doc(db, 'users', uid), userData);
    secureLog('User document created successfully');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Text>
        
        <Text style={styles.subtitle}>
          {isSignup ? 'Sign up as a' : 'Sign in to your'} {userType}
        </Text>

        {usePhoneAuth ? (
          <>
            <Text style={styles.sectionTitle}>Phone Authentication</Text>
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              isRequired
            />
            
            <Button
              title="Send OTP"
              onPress={handleAuth}
              loading={loading}
              fullWidth
              style={styles.button}
            />
            
            <Text style={styles.orText}>or</Text>
            
            <Button
              title="Use Email/Password Instead"
              onPress={() => setUsePhoneAuth(false)}
              variant="outline"
              fullWidth
              style={styles.button}
            />
          </>
        ) : (
          <>
            <Text style={styles.devNote}>
              📧 Using email/password for authentication
            </Text>

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              isRequired
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              isRequired
            />

            <Button
              title={isSignup ? 'Create Account' : 'Sign In'}
              onPress={handleAuth}
              loading={loading}
              fullWidth
              style={styles.button}
            />
            
            <Button
              title="Back to Phone Auth"
              onPress={() => setUsePhoneAuth(true)}
              variant="outline"
              fullWidth
              style={styles.button}
            />
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Text style={styles.linkText} onPress={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Sign in' : 'Sign up'}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  devNote: {
    fontSize: 14,
    textAlign: 'center',
    color: '#059669',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  orText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginVertical: 16,
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