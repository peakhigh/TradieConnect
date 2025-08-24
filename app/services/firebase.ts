import { initializeApp } from 'firebase/app';
import { getAuth, PhoneAuthProvider, signInWithCredential, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';

// Your Firebase configuration
// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Phone auth provider
export const phoneProvider = new PhoneAuthProvider(auth);

// reCAPTCHA verifier for web
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const getRecaptchaVerifier = () => {
  if (Platform.OS === 'web' && !recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
  }
  return recaptchaVerifier;
};

// Platform-specific phone verification
export const verifyPhoneNumber = async (phoneNumber: string) => {
  try {
    if (Platform.OS === 'web') {
      const appVerifier = getRecaptchaVerifier();
      if (!appVerifier) throw new Error('reCAPTCHA not initialized');
      
      const confirmationResult = await phoneProvider.verifyPhoneNumber(phoneNumber, appVerifier);
      return confirmationResult.verificationId;
    } else {
      // For mobile platforms, you'd use Firebase Auth's phone verification
      // This is a placeholder - implement mobile-specific logic
      throw new Error('Mobile phone auth not implemented yet');
    }
  } catch (error) {
    console.error('Error verifying phone number:', error);
    throw error;
  }
};

// Helper function to sign in with phone credential
export const signInWithPhoneCredential = async (verificationId: string, code: string) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const result = await signInWithCredential(auth, credential);
    return result;
  } catch (error) {
    console.error('Error signing in with phone credential:', error);
    throw error;
  }
};

export default app;
