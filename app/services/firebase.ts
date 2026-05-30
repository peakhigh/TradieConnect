import { initializeApp } from 'firebase/app';
import { getAuth, PhoneAuthProvider, signInWithCredential, RecaptchaVerifier, connectAuthEmulator, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, query, where, getDocs, limit, onSnapshot, doc, orderBy, addDoc, deleteDoc, updateDoc, serverTimestamp, Timestamp, startAfter, endBefore, limitToLast, arrayUnion, startAt, getCountFromServer, getDoc, getDocsFromServer } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { Platform } from 'react-native';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
export const functions = getFunctions(app, 'us-central1');

// --- Emulator Connections ---
// Use one host for all emulators. Override with EXPO_PUBLIC_FIREBASE_EMULATOR_HOST
// when running on a physical device or remote simulator.
const emulatorHost =
  process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ||
  (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

const isLocalFunctionsEnabled = process.env.EXPO_PUBLIC_LOCAL_FUNCTIONS === 'true';
if (isLocalFunctionsEnabled) {
  connectFunctionsEmulator(functions, emulatorHost, 5001);
}

const isLocalFirestoreEnabled = process.env.EXPO_PUBLIC_LOCAL_FIRESTORE === 'true';
if (isLocalFirestoreEnabled) {
  connectFirestoreEmulator(db, emulatorHost, 8080);
}

const isLocalAuthEnabled = process.env.EXPO_PUBLIC_LOCAL_AUTH === 'true';
if (isLocalAuthEnabled) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
}

const isLocalStorageEnabled = process.env.EXPO_PUBLIC_LOCAL_STORAGE === 'true';
if (isLocalStorageEnabled) {
  connectStorageEmulator(storage, emulatorHost, 9199);
}

// Debug logging
console.log('🔥 Firebase initialized:', {
  projectId: firebaseConfig.projectId,
  localFunctions: isLocalFunctionsEnabled,
  localFirestore: isLocalFirestoreEnabled,
  localAuth: isLocalAuthEnabled,
  localStorage: isLocalStorageEnabled,
  emulatorHost: (isLocalFunctionsEnabled || isLocalFirestoreEnabled) ? emulatorHost : 'N/A',
  platform: Platform.OS,
});

// --- Phone Auth Helpers ---
export const phoneProvider = new PhoneAuthProvider(auth);

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

export const verifyPhoneNumber = async (phoneNumber: string) => {
  try {
    if (Platform.OS === 'web') {
      const appVerifier = getRecaptchaVerifier();
      if (!appVerifier) throw new Error('reCAPTCHA not initialized');
      const verificationId = await phoneProvider.verifyPhoneNumber(phoneNumber, appVerifier);
      return verificationId;
    } else {
      // Mobile phone auth — implement with native Firebase SDK when needed
      throw new Error('Mobile phone auth not implemented yet');
    }
  } catch (error) {
    console.error('Error verifying phone number:', error);
    throw error;
  }
};

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

// --- Re-exports for convenience ---
// Import these from '@/services/firebase' instead of directly from firebase packages
export {
  // Auth
  onAuthStateChanged,
  signOut,
  // Firestore
  collection, query, where, getDocs, getDocsFromServer, limit, onSnapshot, doc, orderBy,
  addDoc, deleteDoc, updateDoc, serverTimestamp, Timestamp,
  startAfter, endBefore, limitToLast, arrayUnion, startAt,
  getCountFromServer, getDoc,
  // Functions
  httpsCallable,
  // Storage
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
};

export default app;
