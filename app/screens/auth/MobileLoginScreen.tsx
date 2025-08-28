import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { View, Text, StyleSheet, Alert, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { theme } from '../../theme/theme';
import { createCrossPlatformStyle } from '../../theme/crossPlatform';
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
  
  // Check URL parameters for userType if not in route params
  if (Platform.OS === 'web' && !route.params?.userType) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserType = urlParams.get('userType');
    if (urlUserType && (urlUserType === 'customer' || urlUserType === 'tradie')) {
      userType = urlUserType as 'customer' | 'tradie';
    }
  }
  
  const { setUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const { control, handleSubmit, watch, formState: { errors }, setError, clearErrors, reset, setValue } = useForm({
    defaultValues: {
      phoneNumber: '',
      otp: ''
    },
    mode: 'onChange'
  });
  
  const phoneNumber = watch('phoneNumber');
  const otp = watch('otp');

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(\+61|0)[4-5]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateOtp = (otpCode: string) => {
    return otpCode.length === 6 && /^\d+$/.test(otpCode);
  };

  const handleSendOtp = async (data: { phoneNumber: string }) => {
    if (!data.phoneNumber.trim()) {
      setError('phoneNumber', { message: 'Phone number is required' });
      return;
    }
    if (!validatePhoneNumber(data.phoneNumber)) {
      setError('phoneNumber', { message: 'Please enter a valid Australian mobile number' });
      return;
    }
    
    clearErrors('phoneNumber');
    setLoading(true);
    try {
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
      const { auth } = await import('../../services/firebase');
      
      // Format phone number for Firebase (add +61 prefix)
      const formattedPhone = data.phoneNumber.startsWith('0') 
        ? '+61' + data.phoneNumber.substring(1)
        : data.phoneNumber.startsWith('+61') 
        ? data.phoneNumber 
        : '+61' + data.phoneNumber;
      
      // Create reCAPTCHA verifier for web
      if (Platform.OS === 'web' && !window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {}
        });
      }
      
      const appVerifier = Platform.OS === 'web' ? window.recaptchaVerifier : undefined;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      

      // Clear OTP field when switching to OTP screen
      setTimeout(() => setValue('otp', ''), 100);
      clearErrors('otp');
      setOtpSent(true);
      Alert.alert('OTP Sent', 'Please check your phone for the verification code');
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (data: { otp: string }) => {
    if (!data.otp.trim()) {
      setError('otp', { message: 'OTP is required' });
      return;
    }
    if (!validateOtp(data.otp)) {
      setError('otp', { message: 'Please enter a valid 6-digit OTP' });
      return;
    }
    
    clearErrors('otp');
    setLoading(true);
    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
        throw new Error('No confirmation result found');
      }
      
      const result = await confirmationResult.confirm(data.otp);
      const firebaseUser = result.user;
      

      
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

      } else {
        userData = { id: firebaseUser.uid, ...userDoc.data() };

      }
      
      // The AuthContext will automatically handle the Firebase Auth state change

      
    } catch (error) {
      console.error('Error verifying OTP:', error);
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
          {otpSent ? 'Enter Verification Code' : 'Welcome'}
        </Text>
        
        <Text style={styles.formSubtitle}>
          {otpSent 
            ? `We've sent a 6-digit code to ${watch('phoneNumber')}`
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
        {Platform.OS === 'web' && (
          <View style={{ position: 'absolute', top: -1000, left: -1000 }}>
            <div id="recaptcha-container"></div>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.mobileContainer, { backgroundColor: userInfo.color }]}>
      <View style={styles.mobileContent}>
        <View style={styles.loginForm}>
          <Text style={styles.formTitle}>
            {otpSent ? 'Enter Verification Code' : 'Welcome'}
          </Text>
          
          <Text style={styles.formSubtitle}>
            {otpSent 
              ? `We've sent a 6-digit code to ${watch('phoneNumber')}`
              : 'Enter your phone number to continue'
            }
          </Text>

          {!otpSent ? (
            <>
              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Phone Number"
                    placeholder="0412 345 678"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    style={[styles.input, errors.phoneNumber && styles.errorInput]}
                  />
                )}
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>}

              <Button
                title="Continue"
                onPress={handleSubmit(handleSendOtp)}
                loading={loading}
                fullWidth
                style={styles.button}
              />
            </>
          ) : (
            <>
              <Controller
                control={control}
                name="otp"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Verification Code"
                    placeholder="123456"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    maxLength={6}
                    style={[styles.input, errors.otp && styles.errorInput]}
                  />
                )}
              />
              {errors.otp && <Text style={styles.errorText}>{errors.otp.message}</Text>}

              <Button
                title="Verify & Login"
                onPress={handleSubmit(handleVerifyOtp)}
                loading={loading}
                fullWidth
                style={styles.button}
              />

              <Button
                title="Resend OTP"
                onPress={() => {
                  setOtpSent(false);
                  setValue('otp', '');
                  clearErrors();
                }}
                variant="outline"
                fullWidth
                style={styles.resendButton}
              />
            </>
          )}
        </View>
        {Platform.OS === 'web' && (
          <View style={{ position: 'absolute', top: -1000, left: -1000 }}>
            <div id="recaptcha-container"></div>
          </View>
        )}
      </View>
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
    ...createCrossPlatformStyle({ minHeight: '100vh' }),
  },
  loginForm: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadows.lg,
    alignSelf: 'center',
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
    ...createCrossPlatformStyle({ minHeight: '100vh' }),
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