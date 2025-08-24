import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import PostRequestScreen from '../screens/customer/PostRequestScreen';
import CustomerHistoryScreen from '../screens/customer/CustomerHistoryScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';
import { Home, Plus, History, User } from 'lucide-react-native';
import { theme } from '../theme/theme';

const Tab = createBottomTabNavigator();

export default function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.light,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'web' ? theme.fontSize.sm : 12,
          fontWeight: theme.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          ...theme.shadows.sm,
        },
        headerTitleStyle: {
          color: theme.colors.text.primary,
          fontWeight: theme.fontWeight.bold,
          fontSize: Platform.OS === 'web' ? theme.fontSize.lg : theme.fontSize.md,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={CustomerDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
          headerTitle: 'Dashboard',
        }}
      />
      
      <Tab.Screen
        name="PostRequest"
        component={PostRequestScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Plus size={size} color={color} />
          ),
          headerTitle: 'Post Request',
        }}
      />
      
      <Tab.Screen
        name="History"
        component={CustomerHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <History size={size} color={color} />
          ),
          headerTitle: 'History',
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={CustomerProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
