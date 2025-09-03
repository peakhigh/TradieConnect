import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useRoute, RouteProp } from '@react-navigation/native';
import { secureLog, secureError } from '../../utils/logger';

type RootStackParamList = {
  Login: { userType: 'customer' | 'tradie' };
};

type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

export default function SimpleLoginScreen() {
  const route = useRoute<LoginScreenRouteProp>();
  const userType = route.params?.userType || 'customer';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const createUserDocument = async (uid: string) => {
    const userData = {
      id: uid,
      email: email,
      phoneNumber: '',
      userType: userType,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: '',
      lastName: '',
      ...(userType === 'customer' ? {
        address: ''
      } : {
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
        walletBalance: 10,
        isApproved: false
      })
    };
    
    await setDoc(doc(db, 'users', uid), userData);
    secureLog('User document saved:', userData.userType, uid);
    return userData;
  };

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
        await createUserDocument(result.user.uid);
        secureLog('Account created for:', userType, result.user.uid);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
        secureLog('Signed in:', result.user.uid);
        
        // Check if user document exists, create if not
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          secureLog('Creating user document for existing auth user');
          await createUserDocument(result.user.uid);
          secureLog('User document created successfully');
        }
      }
    } catch (error: any) {
      secureError('Auth error:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Account Exists', 
          'This email is already registered. Try signing in instead.',
          [
            { text: 'OK', onPress: () => setIsSignup(false) }
          ]
        );
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert(
          'Account Not Found', 
          'No account found with this email. Try signing up instead.',
          [
            { text: 'OK', onPress: () => setIsSignup(true) }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
        <Text style={styles.title}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Text>
        
        <Text style={styles.subtitle}>
          {isSignup ? 'Sign up as a' : 'Sign in to your'} {userType}
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
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xxl,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xxxl,
  },
  button: {
    marginTop: theme.spacing.lg,
  },
  footer: {
    marginTop: theme.spacing.xxxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});