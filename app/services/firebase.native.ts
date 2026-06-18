import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  onAuthStateChanged,
  signOut,
  signInWithCustomToken,
  PhoneAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  query,
  where,
  getDocs,
  getDocsFromServer,
  limit,
  onSnapshot,
  doc,
  orderBy,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  startAfter,
  endBefore,
  limitToLast,
  arrayUnion,
  startAt,
  getCountFromServer,
  getDoc,
} from '@react-native-firebase/firestore';
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from '@react-native-firebase/functions';
import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from '@react-native-firebase/storage';
import { getMessaging } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

// Use the default app auto-initialized from google-services.json / GoogleService-Info.plist
const app = getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app, `gs://${process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}`);
export const functions = getFunctions(app, 'us-central1');
export const messaging = getMessaging(app);

// --- Emulator Connections ---
const emulatorHost =
  process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ||
  (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');

// Emulator ports are configurable so multiple sibling projects can run their
// emulators side by side without collisions. Defaults match a standard
// single-project Firebase setup.
const emulatorPort = (envVar: string | undefined, fallback: number) => {
  const parsed = parseInt(envVar || '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const functionsPort = emulatorPort(process.env.EXPO_PUBLIC_EMULATOR_FUNCTIONS_PORT, 5001);
const firestorePort = emulatorPort(process.env.EXPO_PUBLIC_EMULATOR_FIRESTORE_PORT, 8080);
const authPort = emulatorPort(process.env.EXPO_PUBLIC_EMULATOR_AUTH_PORT, 9099);
const storagePort = emulatorPort(process.env.EXPO_PUBLIC_EMULATOR_STORAGE_PORT, 9199);

const isLocalFunctionsEnabled = process.env.EXPO_PUBLIC_LOCAL_FUNCTIONS === 'true';
if (isLocalFunctionsEnabled) {
  connectFunctionsEmulator(functions, emulatorHost, functionsPort);
}

const isLocalFirestoreEnabled = process.env.EXPO_PUBLIC_LOCAL_FIRESTORE === 'true';
if (isLocalFirestoreEnabled) {
  connectFirestoreEmulator(db, emulatorHost, firestorePort);
}

const isLocalAuthEnabled = process.env.EXPO_PUBLIC_LOCAL_AUTH === 'true';
if (isLocalAuthEnabled) {
  connectAuthEmulator(auth, `http://${emulatorHost}:${authPort}`);
}

const isLocalStorageEnabled = process.env.EXPO_PUBLIC_LOCAL_STORAGE === 'true';
if (isLocalStorageEnabled) {
  connectStorageEmulator(storage, emulatorHost, storagePort);
}

console.log('🔥 Firebase (native) initialized:', {
  localFunctions: isLocalFunctionsEnabled,
  localFirestore: isLocalFirestoreEnabled,
  localAuth: isLocalAuthEnabled,
  localStorage: isLocalStorageEnabled,
  emulatorHost: (isLocalFunctionsEnabled || isLocalFirestoreEnabled) ? emulatorHost : 'N/A',
  platform: Platform.OS,
});

// --- Phone Auth Helpers ---
export const phoneProvider = new PhoneAuthProvider(auth);

export const verifyPhoneNumber = async (phoneNumber: string) => {
  // On native, Firebase handles phone auth natively
  const confirmation = await auth.signInWithPhoneNumber(phoneNumber);
  return confirmation;
};

export const signInWithPhoneCredential = async (verificationId: string, code: string) => {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const result = await signInWithCredential(auth, credential);
  return result;
};

export const getRecaptchaVerifier = () => {
  // Not needed on native — Firebase handles verification natively
  return null;
};

// --- Re-exports ---
export {
  onAuthStateChanged,
  signOut,
  signInWithCustomToken,
  collection,
  query,
  where,
  getDocs,
  getDocsFromServer,
  limit,
  onSnapshot,
  doc,
  orderBy,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  startAfter,
  endBefore,
  limitToLast,
  arrayUnion,
  startAt,
  getCountFromServer,
  getDoc,
  httpsCallable,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
};

export default app;
