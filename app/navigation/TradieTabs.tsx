import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TradieDashboard from '../screens/tradie/TradieDashboard';
import ServiceRequestExplorer from '../screens/tradie/ServiceRequestExplorer';
import TradieHistoryScreen from '../screens/tradie/TradieHistoryScreen';
import TradieProfileScreen from '../screens/tradie/TradieProfileScreen';
import { Platform } from 'react-native';
import { Home, Search, History, User } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { isWebDesktop } from '../utils/platform';

const Tab = createBottomTabNavigator();

export default function TradieTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#374151',
        tabBarLabelStyle: {
          fontSize: isWebDesktop ? theme.fontSize.lg : (Platform.OS === 'web' ? theme.fontSize.sm : theme.fontSize.xs),
        },
        tabBarStyle: {
          height: Platform.OS === 'web' ? 70 : undefined,
          paddingBottom: Platform.OS === 'web' ? 10 : undefined,
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
        component={TradieDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Home size={Platform.OS === 'web' ? theme.iconSize.lg : size} color={color} />
          ),
          headerTitle: 'Tradie Dashboard',
        }}
      />
      
      <Tab.Screen
        name="Explorer"
        component={ServiceRequestExplorer}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Search size={Platform.OS === 'web' ? theme.iconSize.lg : size} color={color} />
          ),
          headerTitle: 'Service Requests',
        }}
      />
      
      <Tab.Screen
        name="History"
        component={TradieHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <History size={Platform.OS === 'web' ? theme.iconSize.lg : size} color={color} />
          ),
          headerTitle: 'Job History',
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={TradieProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <User size={Platform.OS === 'web' ? theme.iconSize.lg : size} color={color} />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
