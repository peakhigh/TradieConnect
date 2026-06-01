import { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSave } from './useSave';
import { isWeb } from '../utils/helpers';

/**
 * Mobile push notification lifecycle hook.
 * Handles: permission request, FCM token management, foreground/background notifications.
 * 
 * Only runs on native (iOS/Android). No-op on web.
 * 
 * NOTE: This hook requires @react-native-firebase/messaging which is only available
 * on native builds (not Expo Go). It will only work after running:
 * - npx expo run:android
 * - npx expo run:ios
 */
export default function useMobileNotifications(onRefresh?: () => void) {
  // Skip entirely on web
  if (isWeb()) return null;

  const { user } = useAuth();
  const { updateDocument } = useSave('users');
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!user?.id || isSubscribed.current) return;

    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
      try {
        // Dynamic import — only available on native builds
        const messaging = (await import('@react-native-firebase/messaging')).default;
        const messagingInstance = messaging();

        // Request permission
        const authStatus = await messagingInstance.requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('Push notification permission denied');
          return;
        }

        // Get and save FCM token
        const token = await messagingInstance.getToken();
        if (token && user.id) {
          await updateDocument(user.id, { fcmToken: token });
        }

        // Listen for token refresh
        const tokenUnsubscribe = messagingInstance.onTokenRefresh(async (newToken) => {
          if (user.id) {
            await updateDocument(user.id, { fcmToken: newToken });
          }
        });

        // Foreground message handler
        const messageUnsubscribe = messagingInstance.onMessage(async (remoteMessage) => {
          console.log('📱 Foreground notification:', remoteMessage.notification?.title);
          onRefresh?.();
        });

        // Background notification opened handler
        messagingInstance.onNotificationOpenedApp((remoteMessage) => {
          console.log('📱 Background notification opened:', remoteMessage.data);
          onRefresh?.();
        });

        unsubscribe = () => {
          tokenUnsubscribe();
          messageUnsubscribe();
        };

        isSubscribed.current = true;
      } catch (error: any) {
        // Expected to fail in Expo Go — only works in dev builds
        console.log('Push notifications not available:', error.message);
      }
    };

    setup();

    return () => {
      unsubscribe?.();
    };
  }, [user?.id]);

  // Refresh notifications when app comes to foreground
  useEffect(() => {
    if (isWeb()) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        onRefresh?.();
      }
    });

    return () => subscription.remove();
  }, [onRefresh]);

  return null;
}
