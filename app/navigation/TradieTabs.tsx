import React, { useState, useMemo } from 'react';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import TradieDashboard from '../screens/tradie/TradieDashboard';
import ExplorerScreen from '../screens/tradie/ExplorerScreen';
import TradieHistoryScreen from '../screens/tradie/TradieHistoryScreen';
import TradieProfileScreen from '../screens/tradie/TradieProfileScreen';
import SubmitQuoteScreen from '../screens/tradie/SubmitQuoteScreen';
import InsightsScreen from '../screens/tradie/InsightsScreen';
import SuburbRankingsScreen from '../screens/tradie/SuburbRankingsScreen';
import SuburbDetailScreen from '../screens/tradie/SuburbDetailScreen';
import TradeOpportunityScreen from '../screens/tradie/TradeOpportunityScreen';
import { Home, Search, History, User, MessageCircle, TrendingUp } from 'lucide-react-native';
import WebLayout from './WebLayout';
import BottomTabBar, { TabItem } from './BottomTabBar';
import { AppNavigationProvider } from './NavigationContext';

import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import WalletScreen from '../screens/tradie/WalletScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { useUser } from '../context/UserContext';

const WEB_SIDEBAR_BREAKPOINT = 768;

// Placeholder screens
function SettingsScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}
function HelpScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
}

const TRADIE_TABS: TabItem[] = [
  { name: 'Dashboard', label: 'Home', icon: Home },
  { name: 'Explorer', label: 'Jobs', icon: Search },
  { name: 'History', label: 'History', icon: History },
  { name: 'Messages', label: 'Messages', icon: MessageCircle },
  { name: 'Profile', label: 'Profile', icon: User },
];

function renderScreen(activeRoute: string, routeParams?: any) {
  switch (activeRoute) {
    case 'Dashboard': return <TradieDashboard />;
    case 'Explorer': return <ExplorerScreen />;
    case 'History': return <TradieHistoryScreen />;
    case 'Messages': return <ChatListScreen />;
    case 'Chat': return <ChatScreen chatRoomId={routeParams?.chatRoomId} otherPartyName={routeParams?.otherPartyName} />;
    case 'Profile': return <TradieProfileScreen />;
    case 'SubmitQuote': return <SubmitQuoteScreen request={routeParams?.request} />;
    case 'Wallet': return <WalletScreen />;
    case 'Insights': return <InsightsScreen />;
    case 'SuburbRankings': return <SuburbRankingsScreen />;
    case 'SuburbDetail': return <SuburbDetailScreen suburbKey={routeParams?.suburbKey} suburb={routeParams?.suburb} postcode={routeParams?.postcode} />;
    case 'TradeOpportunity': return <TradeOpportunityScreen />;
    case 'Notifications': return <NotificationsScreen />;
    case 'Settings': return <SettingsScreen />;
    case 'Help': return <HelpScreen />;
    default: return <TradieDashboard />;
  }
}

// --- WEB WIDE: Sidebar layout ---
function TradieWebLayout() {
  const [activeRoute, setActiveRoute] = useState('Dashboard');
  const [routeParams, setRouteParams] = useState<any>(null);

  const navContext = useMemo(() => ({
    navigate: (screen: string, params?: any) => {
      setActiveRoute(screen);
      setRouteParams(params || null);
    },
    activeRoute,
  }), [activeRoute]);

  return (
    <AppNavigationProvider value={navContext}>
      <WebLayout activeRoute={activeRoute} onNavigate={(route) => { setActiveRoute(route); setRouteParams(null); }}>
        {renderScreen(activeRoute, routeParams)}
      </WebLayout>
    </AppNavigationProvider>
  );
}

// --- MOBILE / NARROW WEB: Bottom tabs layout ---
function TradieMobileLayout() {
  const [activeRoute, setActiveRoute] = useState('Dashboard');
  const [routeParams, setRouteParams] = useState<any>(null);
  const { unreadMessageCount } = useUser();

  const navContext = useMemo(() => ({
    navigate: (screen: string, params?: any) => {
      setActiveRoute(screen);
      setRouteParams(params || null);
    },
    activeRoute,
  }), [activeRoute]);

  // Hide bottom tabs on Chat screen
  const showTabs = activeRoute !== 'Chat' && activeRoute !== 'SubmitQuote'
    && activeRoute !== 'SuburbRankings' && activeRoute !== 'SuburbDetail' && activeRoute !== 'TradeOpportunity';

  const tabs = useMemo<TabItem[]>(() => TRADIE_TABS.map((t) =>
    t.name === 'Messages' ? { ...t, badge: unreadMessageCount } : t
  ), [unreadMessageCount]);

  return (
    <AppNavigationProvider value={navContext}>
      <View style={styles.mobileContainer}>
        <View style={styles.screenContent}>
          {renderScreen(activeRoute, routeParams)}
        </View>
        {showTabs && (
          <BottomTabBar
            tabs={tabs}
            activeTab={activeRoute}
            onTabPress={(tab) => { setActiveRoute(tab); setRouteParams(null); }}
          />
        )}
      </View>
    </AppNavigationProvider>
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
