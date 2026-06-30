import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { registerWebPush, isWebPushEnabled } from '../services/webPush';

/**
 * Web push lifecycle hook. Registers the browser for FCM web push once a user is
 * authenticated and the feature is enabled (EXPO_PUBLIC_WEB_PUSH_ENABLED +
 * EXPO_PUBLIC_FIREBASE_VAPID_KEY). No-op on native and when the flag is off.
 *
 * The in-app notification feed already updates live on web via Firestore; this
 * adds real OS-level push (including background, via the service worker).
 */
export default function useWebNotifications(onRefresh?: () => void) {
  const { user } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!user?.id || registered.current || !isWebPushEnabled()) return;

    registered.current = true;
    let cleanup: (() => void) | undefined;

    registerWebPush(user.id, onRefresh)
      .then((unsub) => {
        cleanup = unsub;
      })
      .catch(() => {
        registered.current = false;
      });

    return () => {
      cleanup?.();
    };
  }, [user?.id, onRefresh]);

  return null;
}
