import React from 'react';
import { AuthProvider } from './app/context/AuthContext';
import { UserProvider } from './app/context/UserContext';
import { AppNavigator } from './app/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <AppNavigator />
      </UserProvider>
    </AuthProvider>
  );
}
