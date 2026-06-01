import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import WebSidebar from './WebSidebar';

interface WebLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  onNavigate: (route: string) => void;
}

/**
 * Web layout wrapper — sidebar + content area.
 * On narrow viewports (<768px), sidebar collapses and content goes full width.
 */
export default function WebLayout({ children, activeRoute, onNavigate }: WebLayoutProps) {
  const { width } = useWindowDimensions();
  const showSidebar = width >= 768;

  return (
    <View style={styles.layout}>
      {showSidebar && (
        <WebSidebar activeRoute={activeRoute} onNavigate={onNavigate} />
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
