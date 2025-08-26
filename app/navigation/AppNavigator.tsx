import React, { useEffect, useState } from 'react';
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
import HomeScreen from '../screens/HomeScreen';

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

  if (!user) {
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
