import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import CustomerTabs from './CustomerTabs';
import TradieTabs from './TradieTabs';
import AdminDashboard from '../screens/admin/AdminDashboard';
import LoadingScreen from '../screens/LoadingScreen';
import UserTypeSelectionScreen from '../screens/UserTypeSelectionScreen';
import HomeScreen from '../screens/HomeScreen';
import TradieOnboardingScreen from '../screens/tradie/TradieOnboardingScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [initialRoute, setInitialRoute] = useState('UserTypeSelection');

  useEffect(() => {
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      const userType = urlParams.get('userType');
      if (userType && (userType === 'customer' || userType === 'tradie')) {
        setInitialRoute('Login');
      }
    }
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const linking = Platform.OS === 'web' ? {
    prefixes: ['http://localhost:8081', 'https://tradie-mate-f852a.web.app'],
    config: {
      screens: {
        Home: '/',
        UserTypeSelection: '/select',
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

  console.log('APPNAVIGATOR - Current user:', user);
  console.log('APPNAVIGATOR - User type:', user?.userType);
  console.log('APPNAVIGATOR - Onboarding completed:', user?.onboardingCompleted);
  
  if (!user) {
    console.log('APPNAVIGATOR - No user, showing auth screens');
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  console.log('APPNAVIGATOR - User authenticated, determining screen...');
  
  // Minimal test — render CustomerTabs or TradieTabs directly without Stack wrapper
  if (user.userType === 'customer') {
    return (
      <NavigationContainer linking={linking}>
        <CustomerTabs />
      </NavigationContainer>
    );
  }

  if (user.userType === 'tradie') {
    if (!user.onboardingCompleted) {
      return (
        <NavigationContainer linking={linking}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TradieOnboarding" component={TradieOnboardingScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }
    return (
      <NavigationContainer linking={linking}>
        <TradieTabs />
      </NavigationContainer>
    );
  }

  if (user.userType === 'admin') {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Fallback
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
