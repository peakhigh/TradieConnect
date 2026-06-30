/**
 * Web push (FCM for the browser).
 *
 * Gated behind two env vars so it can be enabled/disabled without code changes:
 *   - EXPO_PUBLIC_WEB_PUSH_ENABLED = 'true' | 'false'
 *   - EXPO_PUBLIC_FIREBASE_VAPID_KEY = <web push certificate key pair>
 *
 * Requires a service worker at /firebase-messaging-sw.js (see public/). The web
 * FCM token is stored on the user doc as `webPushToken` so Cloud Functions can
 * deliver to the browser as well as native devices.
 *
 * No-op on native (the native flow lives in useMobileNotifications) and a no-op
 * when the flag is off or the browser lacks the required APIs.
 */
import { Platform } from 'react-native';
import { app, db, doc, updateDoc } from './firebase';
import { secureError } from '../utils/logger';

const VAPID_KEY = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || '';

export const isWebPushEnabled = (): boolean =>
  Platform.OS === 'web' &&
  process.env.EXPO_PUBLIC_WEB_PUSH_ENABLED === 'true' &&
  VAPID_KEY.length > 0;

/**
 * Build the service worker URL with the Firebase web config passed as query
 * params. The SW can't read process.env, so it reads these from its own URL.
 * All of these values are public client config (safe to expose).
 */
const serviceWorkerUrl = (): string => {
  const params = new URLSearchParams({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
};

type Cleanup = () => void;

/**
 * Register the browser for web push and persist its token to the user doc.
 * `onForeground` is invoked when a push arrives while the tab is focused
 * (FCM does not show a system notification in that case).
 *
 * Returns a cleanup function (unsubscribes the foreground listener).
 */
export async function registerWebPush(
  userId: string,
  onForeground?: () => void
): Promise<Cleanup | undefined> {
  if (!isWebPushEnabled()) return undefined;

  // Guard required browser APIs (older browsers / SSR).
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    typeof Notification === 'undefined'
  ) {
    return undefined;
  }

  try {
    // firebase/messaging is web-only; import lazily so native bundles skip it.
    const messagingMod = await import('firebase/messaging');
    const { getMessaging, getToken, onMessage, isSupported } = messagingMod;

    if (!(await isSupported())) return undefined;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return undefined;

    const registration = await navigator.serviceWorker.register(serviceWorkerUrl());
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token && userId) {
      await updateDoc(doc(db, 'users', userId), { webPushToken: token });
    }

    const unsubscribe = onMessage(messaging, () => {
      // Foreground message: refresh in-app feed (no system banner is shown).
      onForeground?.();
    });

    return () => {
      try {
        unsubscribe();
      } catch {
        // ignore
      }
    };
  } catch (e) {
    secureError('Web push registration failed:', e);
    return undefined;
  }
}
