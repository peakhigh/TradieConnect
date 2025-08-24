import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet, Platform } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { useAuth } from '../../context/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

interface DevLoginScreenProps {
  userType: 'customer' | 'tradie';
  onNavigateToSignup: () => void;
}

export default function DevLoginScreen({ userType, onNavigateToSignup }: DevLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (isSignup) {
        result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document
        const userData = {
          id: result.user.uid,
          email: email,
          userType: userType,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(userType === 'customer' ? {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            address: ''
          } : {
            firstName: '',
            lastName: '',
            businessName: '',
            phoneNumber: '',
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
        
        await setDoc(doc(db, 'users', result.user.uid), userData);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Login successful!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
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

        <Text style={styles.devNote}>
          🚧 Development Mode - Using email/password for testing
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
    marginBottom: 16,
  },
  devNote: {
    fontSize: 14,
    textAlign: 'center',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
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