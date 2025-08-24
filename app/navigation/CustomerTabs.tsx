import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import PostRequestScreen from '../screens/customer/PostRequestScreen';
import CustomerHistoryScreen from '../screens/customer/CustomerHistoryScreen';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

export default function CustomerTabs() {
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
        component={CustomerDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
          headerTitle: 'Customer Dashboard',
        }}
      />
      
      <Tab.Screen
        name="PostRequest"
        component={PostRequestScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>➕</Text>
          ),
          headerTitle: 'Post Service Request',
        }}
      />
      
      <Tab.Screen
        name="History"
        component={CustomerHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📋</Text>
          ),
          headerTitle: 'Request History',
        }}
      />
    </Tab.Navigator>
  );
}
