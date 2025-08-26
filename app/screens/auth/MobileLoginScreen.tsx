import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Phone, Shield, Home, Wrench } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

type RootStackParamList = {
  Login: { userType: 'customer' | 'tradie' };
};

type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function MobileLoginScreen() {
  const route = useRoute<LoginScreenRouteProp>();
  let userType = route.params?.userType || 'customer';
  
  console.log('🔍 LOGIN SCREEN - Initial route params:', route.params);
  console.log('🔍 LOGIN SCREEN - Initial userType:', userType);
  console.log('🔍 LOGIN SCREEN - Current URL:', Platform.OS === 'web' ? window.location.href : 'N/A');
  
  // Check URL parameters for userType if not in route params
  if (Platform.OS === 'web' && !route.params?.userType) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserType = urlParams.get('userType');
    console.log('🔍 LOGIN SCREEN - URL userType param:', urlUserType);
    if (urlUserType && (urlUserType === 'customer' || urlUserType === 'tradie')) {
      userType = urlUserType as 'customer' | 'tradie';
      console.log('🔍 LOGIN SCREEN - Updated userType from URL:', userType);
    }
  }
  
  const { setUser } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSignUp, setIsSignUp] = useState(false);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(\+61|0)[4-5]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateOtp = (otpCode: string) => {
    return otpCode.length === 6 && /^\d+$/.test(otpCode);
  };

  const handleSendOtp = async () => {
    console.log('🔄 Starting OTP send process...');
    console.log('📱 Phone number:', phoneNumber);
    
    const newErrors: {[key: string]: string} = {};
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      console.log('❌ Validation failed: Phone number empty');
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Australian mobile number';
      console.log('❌ Validation failed: Invalid phone format');
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Stopping due to validation errors');
      return;
    }

    console.log('✅ Validation passed, sending OTP...');
    setLoading(true);
    try {
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
      const { auth } = await import('../../services/firebase');
      
      // Format phone number for Firebase (add +61 prefix)
      const formattedPhone = phoneNumber.startsWith('0') 
        ? '+61' + phoneNumber.substring(1)
        : phoneNumber.startsWith('+61') 
        ? phoneNumber 
        : '+61' + phoneNumber;
      
      console.log('Formatted phone:', formattedPhone);
      
      // Create reCAPTCHA verifier for web
      if (Platform.OS === 'web' && !window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          }
        });
      }
      
      const appVerifier = Platform.OS === 'web' ? window.recaptchaVerifier : undefined;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      
      console.log('✅ OTP sent successfully');
      setOtpSent(true);
      Alert.alert('OTP Sent', 'Please check your phone for the verification code');
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    console.log('🔄 Starting OTP verification...');
    console.log('🔢 OTP entered:', otp);
    
    const newErrors: {[key: string]: string} = {};
    
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
      console.log('❌ Validation failed: OTP empty');
    } else if (!validateOtp(otp)) {
      newErrors.otp = 'Please enter a valid 6-digit OTP';
      console.log('❌ Validation failed: Invalid OTP format');
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Stopping due to validation errors');
      return;
    }

    console.log('✅ OTP validation passed, verifying...');
    setLoading(true);
    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
        throw new Error('No confirmation result found');
      }
      
      const result = await confirmationResult.confirm(otp);
      const firebaseUser = result.user;
      
      console.log('✅ Firebase Auth successful:', firebaseUser.uid);
      
      // Create or get user document in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      let userData;
      
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user
        userData = {
          id: firebaseUser.uid,
          phoneNumber: phoneNumber,
          userType: userType,
          createdAt: new Date(),
          updatedAt: new Date(),
          firstName: '',
          lastName: '',
          email: '',
          ...(userType === 'customer' ? {
            streetAddress: '',
            suburb: '',
            state: '',
            postcode: ''
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
        
        await setDoc(userDocRef, userData);
        console.log('✅ New user created in Firestore');
      } else {
        userData = { id: firebaseUser.uid, ...userDoc.data() };
        console.log('✅ Existing user found');
      }
      
      // The AuthContext will automatically handle the Firebase Auth state change
      console.log('✅ User authenticated, navigation will happen automatically');
      
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeInfo = () => {
    if (userType === 'customer') {
      return {
        title: 'Welcome Customer',
        subtitle: 'Find trusted tradies for your home projects',
        icon: <Home size={64} color={theme.colors.text.inverse} />,
        color: theme.colors.primary
      };
    } else {
      return {
        title: 'Welcome Tradie',
        subtitle: 'Connect with customers and grow your business',
        icon: <Wrench size={64} color={theme.colors.text.inverse} />,
        color: theme.colors.secondary
      };
    }
  };

  const userInfo = getUserTypeInfo();

  const renderLeftSide = () => (
    <LinearGradient
      colors={[userInfo.color, theme.colors.primaryDark]}
      style={styles.leftSide}
    >
      <View style={styles.leftContent}>
        {userInfo.icon}
        <Text style={styles.leftTitle}>{userInfo.title}</Text>
        <Text style={styles.leftSubtitle}>{userInfo.subtitle}</Text>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <Shield size={24} color={theme.colors.text.inverse} />
            <Text style={styles.featureText}>Secure & Verified</Text>
          </View>
          <View style={styles.feature}>
            <Phone size={24} color={theme.colors.text.inverse} />
            <Text style={styles.featureText}>Quick OTP Login</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const renderRightSide = () => (
    <View style={styles.rightSide}>
      <View style={styles.loginForm}>
        <Text style={styles.formTitle}>
          {otpSent ? 'Enter Verification Code' : 'Sign in / Sign up'}
        </Text>
        
        <Text style={styles.formSubtitle}>
          {otpSent 
            ? `We've sent a 6-digit code to ${phoneNumber}`
            : 'Enter your mobile number to get started'
          }
        </Text>

        {!otpSent ? (
          <>
            <Input
              label="Mobile Number"
              placeholder="0412 345 678"
              value={phoneNumber}
              onChangeText={(value) => {
                setPhoneNumber(value);
                if (errors.phoneNumber) {
                  setErrors(prev => ({...prev, phoneNumber: ''}));
                }
              }}
              keyboardType="phone-pad"
              style={[styles.input, errors.phoneNumber && styles.errorInput]}
            />
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              loading={loading}
              fullWidth
              style={styles.button}
            />
          </>
        ) : (
          <>
            <Input
              label="Verification Code"
              placeholder="123456"
              value={otp}
              onChangeText={(value) => {
                setOtp(value);
                if (errors.otp) {
                  setErrors(prev => ({...prev, otp: ''}));
                }
              }}
              keyboardType="numeric"
              maxLength={6}
              style={[styles.input, errors.otp && styles.errorInput]}
            />
            {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

            <Button
              title="Verify & Login"
              onPress={handleVerifyOtp}
              loading={loading}
              fullWidth
              style={styles.button}
            />

            <Button
              title="Resend OTP"
              onPress={() => {
                setOtpSent(false);
                setOtp('');
                setErrors({});
              }}
              variant="outline"
              fullWidth
              style={styles.resendButton}
            />
          </>
        )}
      </View>
    </View>
  );

  if (isWeb && width > 768) {
    return (
      <View style={styles.webContainer}>
        {renderLeftSide()}
        {renderRightSide()}
        {Platform.OS === 'web' && <div id="recaptcha-container"></div>}
      </View>
    );
  }

  return (
    <View style={[styles.mobileContainer, { backgroundColor: userInfo.color }]}>
      <Container>
        <View style={styles.mobileContent}>
        <View style={styles.loginForm}>
          <Text style={styles.formTitle}>
            {otpSent ? 'Enter Verification Code' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Text>
          
          <Text style={styles.formSubtitle}>
            {otpSent 
              ? `We've sent a 6-digit code to ${phoneNumber}`
              : 'We\'ll send you a verification code'
            }
          </Text>

          {!otpSent ? (
            <>
              <Input
                label="Phone Number"
                placeholder="0412 345 678"
                value={phoneNumber}
                onChangeText={(value) => {
                  setPhoneNumber(value);
                  if (errors.phoneNumber) {
                    setErrors(prev => ({...prev, phoneNumber: ''}));
                  }
                }}
                keyboardType="phone-pad"
                style={[styles.input, errors.phoneNumber && styles.errorInput]}
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

              <Button
                title={isSignUp ? 'Create Account' : 'Send OTP'}
                onPress={handleSendOtp}
                loading={loading}
                fullWidth
                style={styles.button}
              />
              
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <Text 
                    style={styles.linkText} 
                    onPress={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              <Input
                label="Verification Code"
                placeholder="123456"
                value={otp}
                onChangeText={(value) => {
                  setOtp(value);
                  if (errors.otp) {
                    setErrors(prev => ({...prev, otp: ''}));
                  }
                }}
                keyboardType="numeric"
                maxLength={6}
                style={[styles.input, errors.otp && styles.errorInput]}
              />
              {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

              <Button
                title="Verify & Login"
                onPress={handleVerifyOtp}
                loading={loading}
                fullWidth
                style={styles.button}
              />

              <Button
                title="Resend OTP"
                onPress={() => {
                  setOtpSent(false);
                  setOtp('');
                  setErrors({});
                }}
                variant="outline"
                fullWidth
                style={styles.resendButton}
              />
            </>
          )}
          </View>
        </View>
        {Platform.OS === 'web' && <div id="recaptcha-container"></div>}
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxxl,
  },
  leftContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  leftTitle: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  leftSubtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: theme.spacing.xxxl,
  },
  features: {
    gap: theme.spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.medium,
  },
  rightSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xxxl,
  },
  loginForm: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadows.lg,
  },
  formTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxxl,
    fontFamily: theme.fontFamily.regular,
    lineHeight: 26,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  errorInput: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.lg,
  },
  resendButton: {
    marginTop: theme.spacing.md,
  },
  mobileContainer: {
    flex: 1,
  },
  mobileContent: {
    flex: 1,
    padding: theme.spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    fontFamily: theme.fontFamily.regular,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: theme.fontFamily.medium,
  },
  mobileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  mobileTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  mobileSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});