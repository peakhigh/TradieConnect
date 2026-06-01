import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';
import {
  Home,
  Search,
  History,
  MessageCircle,
  User,
  Wallet,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react-native';

interface SidebarItem {
  name: string;
  label: string;
  icon: any;
  route: string;
  section: 'primary' | 'secondary';
}

const TRADIE_MENU: SidebarItem[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: Home, route: 'Dashboard', section: 'primary' },
  { name: 'Explorer', label: 'Explorer', icon: Search, route: 'Explorer', section: 'primary' },
  { name: 'History', label: 'History', icon: History, route: 'History', section: 'primary' },
  { name: 'Messages', label: 'Messages', icon: MessageCircle, route: 'Messages', section: 'primary' },
  { name: 'Profile', label: 'Profile', icon: User, route: 'Profile', section: 'primary' },
  { name: 'Wallet', label: 'Wallet', icon: Wallet, route: 'Wallet', section: 'secondary' },
  { name: 'Notifications', label: 'Notifications', icon: Bell, route: 'Notifications', section: 'secondary' },
  { name: 'Settings', label: 'Settings', icon: Settings, route: 'Settings', section: 'secondary' },
  { name: 'Help', label: 'Help & FAQ', icon: HelpCircle, route: 'Help', section: 'secondary' },
];

const CUSTOMER_MENU: SidebarItem[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: Home, route: 'Dashboard', section: 'primary' },
  { name: 'PostRequest', label: 'Post Request', icon: Search, route: 'PostRequest', section: 'primary' },
  { name: 'History', label: 'History', icon: History, route: 'History', section: 'primary' },
  { name: 'Messages', label: 'Messages', icon: MessageCircle, route: 'Messages', section: 'primary' },
  { name: 'Profile', label: 'Profile', icon: User, route: 'Profile', section: 'primary' },
  { name: 'Notifications', label: 'Notifications', icon: Bell, route: 'Notifications', section: 'secondary' },
  { name: 'Settings', label: 'Settings', icon: Settings, route: 'Settings', section: 'secondary' },
  { name: 'Help', label: 'Help & FAQ', icon: HelpCircle, route: 'Help', section: 'secondary' },
];

interface WebSidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export default function WebSidebar({ activeRoute, onNavigate }: WebSidebarProps) {
  const { user, logout } = useAuth();
  const isTradie = user?.userType === 'tradie';
  const menu = isTradie ? TRADIE_MENU : CUSTOMER_MENU;

  const primaryItems = menu.filter(item => item.section === 'primary');
  const secondaryItems = menu.filter(item => item.section === 'secondary');

  const renderItem = (item: SidebarItem) => {
    const isActive = activeRoute === item.route;
    const IconComponent = item.icon;

    return (
      <TouchableOpacity
        key={item.name}
        style={[styles.menuItem, isActive && styles.menuItemActive]}
        onPress={() => onNavigate(item.route)}
        activeOpacity={0.7}
      >
        <IconComponent
          size={20}
          color={isActive ? theme.colors.primary : 'rgba(255,255,255,0.75)'}
        />
        <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.sidebar}>
      {/* Logo / Brand */}
      <View style={styles.brandSection}>
        <Text style={styles.brandText}>🔧 TradieConnect</Text>
        <Text style={styles.roleText}>
          {isTradie ? 'Tradie' : 'Customer'}
        </Text>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.firstName || 'User'}
          </Text>
          {isTradie && (
            <Text style={styles.walletText}>
              💰 ${(user as any)?.walletBalance?.toFixed(2) || '0.00'}
            </Text>
          )}
        </View>
      </View>

      {/* Primary Navigation */}
      <View style={styles.menuSection}>
        {primaryItems.map(renderItem)}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Secondary Navigation */}
      <View style={styles.menuSection}>
        {secondaryItems.map(renderItem)}
      </View>

      {/* Logout at bottom */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#0A2E5A',
    paddingVertical: 20,
    height: '100%',
  },
  brandSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E4377',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  roleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E4377',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A2E5A',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  walletText: {
    fontSize: 12,
    color: '#8b8ba8',
    marginTop: 2,
  },
  menuSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: '#E0F2FE',
    borderLeftColor: '#E0F2FE',
  },
  menuLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginLeft: 12,
  },
  menuLabelActive: {
    color: '#0A2E5A',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E4377',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E4377',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 14,
    color: theme.colors.error,
    marginLeft: 12,
  },
});
