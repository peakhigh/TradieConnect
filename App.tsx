import React from 'react';
import { AuthProvider } from './app/context/AuthContext';
import { UserProvider } from './app/context/UserContext';
import { NotificationsProvider } from './app/context/NotificationsContext';
import { AppNavigator } from './app/navigation/AppNavigator';
import { AppErrorBoundary } from './app/components/ErrorBoundary';
import { AlertProvider } from './app/components/UI/AlertProvider';
import useMobileNotifications from './app/hooks/useMobileNotifications';
import useWebNotifications from './app/hooks/useWebNotifications';
import { featureFlags } from './app/utils/featureFlags';

if (__DEV__) {
  console.log('🚩 Feature flags:', {
    useMocks: featureFlags.useMocks,
    autofill: featureFlags.autofill,
    skipCaptcha: featureFlags.skipCaptcha,
    skipToasts: featureFlags.skipToasts,
    enableDeleteData: featureFlags.enableDeleteData,
  });
}

/**
 * Registers the device for push notifications once a user is authenticated.
 * Native push via useMobileNotifications; web push (FCM) via useWebNotifications.
 * Each hook is a no-op on the platform it doesn't serve. Must live inside AuthProvider.
 */
function PushRegistrar() {
  useMobileNotifications();
  useWebNotifications();
  return null;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AlertProvider>
        <AuthProvider>
          <UserProvider>
            <NotificationsProvider>
              <PushRegistrar />
              <AppNavigator />
            </NotificationsProvider>
          </UserProvider>
        </AuthProvider>
      </AlertProvider>
    </AppErrorBoundary>
  );
}
