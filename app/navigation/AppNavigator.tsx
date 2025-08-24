import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import MobileLoginScreen from '../screens/auth/MobileLoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import CustomerTabs from './CustomerTabs';
import TradieTabs from './TradieTabs';
import AdminDashboard from '../screens/admin/AdminDashboard';
import LoadingScreen from '../screens/LoadingScreen';
import UserTypeSelectionScreen from '../screens/UserTypeSelectionScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const linking = Platform.OS === 'web' ? {
    prefixes: ['http://localhost:8081', 'https://tradieconnect.app'],
    config: {
      screens: {
        UserTypeSelection: '/',
        Login: '/login',
        Signup: '/signup',
        CustomerTabs: {
          screens: {
            Dashboard: '/dashboard',
            PostRequest: '/post-request',
            History: '/history',
            Profile: '/profile',
          },
        },
        TradieTabs: {
          screens: {
            Dashboard: '/tradie/dashboard',
            Explorer: '/tradie/explorer',
            History: '/tradie/history',
            Profile: '/tradie/profile',
          },
        },
        AdminDashboard: '/admin',
      },
    },
  } : undefined;

  if (!user) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
          <Stack.Screen name="Login" component={MobileLoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user.userType === 'customer' && (
          <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
        )}
        
        {user.userType === 'tradie' && (
          <Stack.Screen name="TradieTabs" component={TradieTabs} />
        )}
        
        {user.userType === 'admin' && (
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
