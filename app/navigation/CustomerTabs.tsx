import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import PostRequestScreen from '../screens/customer/PostRequestScreen';
import CustomerHistoryScreen from '../screens/customer/CustomerHistoryScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';
import InterestsScreen from '../screens/customer/InterestsScreen';
import MessagesScreen from '../screens/customer/MessagesScreen';
import { Home, Plus, History, User } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { isWebDesktop } from '../utils/platform';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={CustomerDashboard} />
      <Stack.Screen name="Interests" component={InterestsScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
    </Stack.Navigator>
  );
}

export default function CustomerTabs() {
  const insets = useSafeAreaInsets();
  
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
        component={DashboardStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Home size={Platform.OS === 'web' ? theme.iconSize.lg : size} color={color} />
          ),
          headerTitle: 'Dashboard',
        }}
      />
      
      <Tab.Screen
        name="PostRequest"
        component={PostRequestScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Plus size={Platform.OS === 'web' ? theme.iconSize.lg : size} color={color} />
          ),
          headerTitle: 'Post Request',
        }}
      />
      
      <Tab.Screen
        name="History"
        component={CustomerHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <History size={Platform.OS === 'web' ? theme.iconSize.lg : size} color={color} />
          ),
          headerTitle: 'History',
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={CustomerProfileScreen}
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
