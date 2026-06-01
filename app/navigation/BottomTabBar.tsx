import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { theme } from '../theme/theme';

export interface TabItem {
  name: string;
  label: string;
  icon: any; // Lucide icon component
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

/**
 * Custom bottom tab bar that works on iOS, Android, and Web.
 * No dependency on @react-navigation/bottom-tabs.
 */
export default function BottomTabBar({ tabs, activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        const IconComponent = tab.icon;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <IconComponent
              size={22}
              color={isActive ? theme.colors.primary : '#6b7280'}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
