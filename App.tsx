import React from 'react';
import { AuthProvider } from './app/context/AuthContext';
import { UserProvider } from './app/context/UserContext';
import { AppNavigator } from './app/navigation/AppNavigator';
import { AppErrorBoundary } from './app/components/ErrorBoundary';
import { AlertProvider } from './app/components/UI/AlertProvider';
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

export default function App() {
  return (
    <AppErrorBoundary>
      <AlertProvider>
        <AuthProvider>
          <UserProvider>
            <AppNavigator />
          </UserProvider>
        </AuthProvider>
      </AlertProvider>
    </AppErrorBoundary>
  );
}
