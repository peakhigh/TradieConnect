import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TradieDashboard from '../screens/tradie/TradieDashboard';
import ServiceRequestExplorer from '../screens/tradie/ServiceRequestExplorer';
import TradieHistoryScreen from '../screens/tradie/TradieHistoryScreen';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TradieTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          color: '#1f2937',
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={TradieDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
          headerTitle: 'Tradie Dashboard',
        }}
      />
      
      <Tab.Screen
        name="Explorer"
        component={ServiceRequestExplorer}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🔍</Text>
          ),
          headerTitle: 'Service Requests',
        }}
      />
      
      <Tab.Screen
        name="History"
        component={TradieHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📋</Text>
          ),
          headerTitle: 'Job History',
        }}
      />
    </Tab.Navigator>
  );
}
