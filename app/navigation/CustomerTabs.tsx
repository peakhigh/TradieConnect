import React, { useState, useMemo } from 'react';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import PostRequestScreen from '../screens/customer/PostRequestScreen';
import CustomerHistoryScreen from '../screens/customer/CustomerHistoryScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';
import InterestsScreen from '../screens/customer/InterestsScreen';
import MessagesScreen from '../screens/customer/MessagesScreen';
import { Home, Plus, History, User, MessageCircle } from 'lucide-react-native';
import WebLayout from './WebLayout';
import BottomTabBar, { TabItem } from './BottomTabBar';
import { AppNavigationProvider } from './NavigationContext';

const WEB_SIDEBAR_BREAKPOINT = 768;

// Placeholder screens
function NotificationsScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}
function SettingsScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}
function HelpScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}

const CUSTOMER_TABS: TabItem[] = [
  { name: 'Dashboard', label: 'Home', icon: Home },
  { name: 'PostRequest', label: 'Post', icon: Plus },
  { name: 'History', label: 'History', icon: History },
  { name: 'Messages', label: 'Messages', icon: MessageCircle },
  { name: 'Profile', label: 'Profile', icon: User },
];

function renderScreen(activeRoute: string) {
  switch (activeRoute) {
    case 'Dashboard': return <CustomerDashboard />;
    case 'PostRequest': return <PostRequestScreen />;
    case 'History': return <CustomerHistoryScreen />;
    case 'Messages': return <MessagesScreen />;
    case 'Profile': return <CustomerProfileScreen />;
    case 'Interests': return <InterestsScreen />;
    case 'Notifications': return <NotificationsScreen />;
    case 'Settings': return <SettingsScreen />;
    case 'Help': return <HelpScreen />;
    default: return <CustomerDashboard />;
  }
}

// --- WEB WIDE: Sidebar layout ---
function CustomerWebLayout() {
  const [activeRoute, setActiveRoute] = useState('Dashboard');

  const navContext = useMemo(() => ({
    navigate: (screen: string) => setActiveRoute(screen),
    activeRoute,
  }), [activeRoute]);

  return (
    <AppNavigationProvider value={navContext}>
      <WebLayout activeRoute={activeRoute} onNavigate={setActiveRoute}>
        {renderScreen(activeRoute)}
      </WebLayout>
    </AppNavigationProvider>
  );
}

// --- MOBILE / NARROW WEB: Bottom tabs layout ---
function CustomerMobileLayout() {
  const [activeRoute, setActiveRoute] = useState('Dashboard');

  const navContext = useMemo(() => ({
    navigate: (screen: string) => setActiveRoute(screen),
    activeRoute,
  }), [activeRoute]);

  return (
    <AppNavigationProvider value={navContext}>
      <View style={styles.mobileContainer}>
        <View style={styles.screenContent}>
          {renderScreen(activeRoute)}
        </View>
        <BottomTabBar
          tabs={CUSTOMER_TABS}
          activeTab={activeRoute}
          onTabPress={setActiveRoute}
        />
      </View>
    </AppNavigationProvider>
  );
}

export default function CustomerTabs() {
  const { width } = useWindowDimensions();

  if (Platform.OS === 'web' && width >= WEB_SIDEBAR_BREAKPOINT) {
    return <CustomerWebLayout />;
  }
  return <CustomerMobileLayout />;
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
  },
});
