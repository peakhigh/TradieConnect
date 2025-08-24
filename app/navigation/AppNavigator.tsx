import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
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

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
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
