import React from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';

interface ContainerProps {
  children: React.ReactNode;
  style?: any;
  scrollable?: boolean;
}

export const Container: React.FC<ContainerProps> = ({ children, style, scrollable = true }) => {
  if (scrollable) {
    return (
      <View style={[styles.container, style]}>
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
  },
});