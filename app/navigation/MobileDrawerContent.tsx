import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';
import {
  Wallet,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Bug,
} from 'lucide-react-native';

interface DrawerItem {
  label: string;
  icon: any;
  onPress: () => void;
  color?: string;
}

export default function MobileDrawerContent(props: any) {
  const { user, logout } = useAuth();
  const { navigation } = props;
  const isTradie = user?.userType === 'tradie';

  const drawerItems: DrawerItem[] = [
    ...(isTradie ? [{
      label: `Wallet — $${(user as any)?.walletBalance?.toFixed(2) || '0.00'}`,
      icon: Wallet,
      onPress: () => navigation.navigate('Wallet'),
    }] : []),
    {
      label: 'Notifications',
      icon: Bell,
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      label: 'Settings',
      icon: Settings,
      onPress: () => navigation.navigate('Settings'),
    },
    {
      label: 'Help & FAQ',
      icon: HelpCircle,
      onPress: () => navigation.navigate('Help'),
    },
    {
      label: 'Report Issue',
      icon: Bug,
      onPress: () => navigation.navigate('Report'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* User Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.firstName || 'User'} {user?.lastName || ''}
        </Text>
        <Text style={styles.userRole}>
          {isTradie ? 'Tradie' : 'Customer'}
        </Text>
      </View>

      {/* Menu Items */}
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        {drawerItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                navigation.closeDrawer();
                item.onPress();
              }}
              activeOpacity={0.7}
            >
              <IconComponent size={20} color={item.color || theme.colors.text.secondary} />
              <Text style={[styles.menuLabel, item.color ? { color: item.color } : null]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Logout */}
      <View style={styles.footer}>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuLabel: {
    fontSize: 15,
    color: theme.colors.text.primary,
    marginLeft: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 15,
    color: theme.colors.error,
    marginLeft: 14,
  },
});
