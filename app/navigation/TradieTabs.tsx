import React, { useState } from 'react';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import TradieDashboard from '../screens/tradie/TradieDashboard';
import ExplorerScreen from '../screens/tradie/ExplorerScreen';
import TradieHistoryScreen from '../screens/tradie/TradieHistoryScreen';
import TradieProfileScreen from '../screens/tradie/TradieProfileScreen';
import SubmitQuoteScreen from '../screens/tradie/SubmitQuoteScreen';
import { Home, Search, History, User, MessageCircle } from 'lucide-react-native';
import WebLayout from './WebLayout';
import BottomTabBar, { TabItem } from './BottomTabBar';

const WEB_SIDEBAR_BREAKPOINT = 768;

// Placeholder screens
function WalletScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}
function NotificationsScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}
function SettingsScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}
function HelpScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}
function MessagesScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}

const TRADIE_TABS: TabItem[] = [
  { name: 'Dashboard', label: 'Home', icon: Home },
  { name: 'Explorer', label: 'Jobs', icon: Search },
  { name: 'History', label: 'History', icon: History },
  { name: 'Messages', label: 'Messages', icon: MessageCircle },
  { name: 'Profile', label: 'Profile', icon: User },
];

function renderScreen(activeRoute: string) {
  switch (activeRoute) {
    case 'Dashboard': return <TradieDashboard />;
    case 'Explorer': return <ExplorerScreen />;
    case 'History': return <TradieHistoryScreen />;
    case 'Messages': return <MessagesScreen />;
    case 'Profile': return <TradieProfileScreen />;
    case 'SubmitQuote': return <SubmitQuoteScreen />;
    case 'Wallet': return <WalletScreen />;
    case 'Notifications': return <NotificationsScreen />;
    case 'Settings': return <SettingsScreen />;
    case 'Help': return <HelpScreen />;
    default: return <TradieDashboard />;
  }
}

// --- WEB WIDE: Sidebar layout ---
function TradieWebLayout() {
  const [activeRoute, setActiveRoute] = useState('Dashboard');

  return (
    <WebLayout activeRoute={activeRoute} onNavigate={setActiveRoute}>
      {renderScreen(activeRoute)}
    </WebLayout>
  );
}

// --- MOBILE / NARROW WEB: Bottom tabs layout ---
function TradieMobileLayout() {
  const [activeRoute, setActiveRoute] = useState('Dashboard');

  return (
    <View style={styles.mobileContainer}>
      <View style={styles.screenContent}>
        {renderScreen(activeRoute)}
      </View>
      <BottomTabBar
        tabs={TRADIE_TABS}
        activeTab={activeRoute}
        onTabPress={setActiveRoute}
      />
    </View>
  );
}

// --- MAIN EXPORT ---
export default function TradieTabs() {
  const { width } = useWindowDimensions();

  if (Platform.OS === 'web' && width >= WEB_SIDEBAR_BREAKPOINT) {
    return <TradieWebLayout />;
  }
  return <TradieMobileLayout />;
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
  },
});
