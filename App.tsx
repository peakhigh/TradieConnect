import React from 'react';
import { AuthProvider } from './app/context/AuthContext';
import { UserProvider } from './app/context/UserContext';
import { AppNavigator } from './app/navigation/AppNavigator';
import { AppErrorBoundary } from './app/components/ErrorBoundary';

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <UserProvider>
          <AppNavigator />
        </UserProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
