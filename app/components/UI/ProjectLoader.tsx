import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { Wrench, Loader } from 'lucide-react-native';

interface ProjectLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const ProjectLoader: React.FC<ProjectLoaderProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return { container: 60, icon: 24, text: 14 };
      case 'large': return { container: 120, icon: 48, text: 18 };
      default: return { container: 80, icon: 32, text: 16 };
    }
  };

  const sizes = getSize();

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={[styles.container, { 
          width: sizes.container, 
          height: sizes.container,
          borderRadius: sizes.container / 2 
        }]}
      >
        <View style={styles.iconContainer}>
          <Wrench 
            size={sizes.icon} 
            color={theme.colors.text.inverse} 
            style={styles.rotatingIcon}
          />
          <Loader 
            size={sizes.icon * 0.6} 
            color={theme.colors.text.inverse} 
            style={styles.spinningIcon}
          />
        </View>
      </LinearGradient>
      
      <Text style={[styles.message, { fontSize: sizes.text }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
    marginBottom: 16,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotatingIcon: {
    position: 'absolute',
  },
  spinningIcon: {
    position: 'absolute',
  },
  message: {
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
    fontFamily: theme.fontFamily.medium,
  },
});

// Add CSS animations for web
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(-360deg); }
    }
  `;
  document.head.appendChild(style);
}