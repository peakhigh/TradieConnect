import { Platform } from 'react-native';
import { createShadow, createFontFamily } from './crossPlatform';
import { palette } from './palette';

export const theme = {
  colors: {
    primary: palette.primary,
    primaryDark: palette.primaryDark,
    primaryLight: palette.primaryLight,
    secondary: palette.secondary,
    success: palette.success,
    successLight: palette.successLight,
    warning: palette.warning,
    warningLight: palette.warningLight,
    error: palette.error,
    errorLight: palette.errorLight,
    
    background: palette.background,
    surface: palette.surface,
    surfaceSecondary: palette.surfaceSecondary,
    surfaceTertiary: palette.surfaceTertiary,
    
    text: {
      primary: palette.textPrimary,
      secondary: palette.textSecondary,
      tertiary: palette.textTertiary,
      inverse: palette.textInverse,
      disabled: palette.textDisabled,
    },
    
    border: {
      light: palette.borderLight,
      medium: palette.borderMedium,
      dark: palette.borderDark,
      focus: palette.borderFocus,
    },
    
    status: {
      active: palette.statusActive,
      completed: palette.statusCompleted,
      pending: palette.statusPending,
      cancelled: palette.statusCancelled,
    },

    sidebar: {
      bg: palette.sidebarBg,
      surface: palette.sidebarSurface,
      border: palette.sidebarBorder,
      text: palette.sidebarText,
      textActive: palette.sidebarTextActive,
      accent: palette.sidebarAccent,
    },
    
    notification: {
      info: palette.primaryLight,
      infoBorder: palette.primary,
      infoText: palette.primaryDark,
      success: palette.successLight,
      successBorder: palette.success,
      successText: '#065F46',
      warning: palette.warningLight,
      warningBorder: palette.warning,
      warningText: '#92400E',
      error: palette.errorLight,
      errorBorder: palette.error,
      errorText: palette.error,
    },
    
    urgency: {
      high: {
        backgroundColor: palette.errorLight,
        borderColor: palette.error,
        color: palette.textPrimary,
      },
      medium: {
        backgroundColor: palette.warningLight,
        borderColor: palette.warning,
        color: palette.textPrimary,
      },
      low: {
        backgroundColor: palette.successLight,
        borderColor: palette.success,
        color: palette.textPrimary,
      },
    },
  },
  
  spacing: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
  },
  
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  gap: {
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    xxl: 16,
  },
  
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
  },
  
  borderWidth: {
    none: 0,
    thin: 1,
    medium: 2,
    thick: 4,
  },
  
  fontSize: {
    xxs: Platform.OS === 'web' ? 10 : 9,
    xs: Platform.OS === 'web' ? 12 : 10,
    sm: Platform.OS === 'web' ? 14 : 12,
    md: Platform.OS === 'web' ? 16 : 14,
    lg: Platform.OS === 'web' ? 18 : 16,
    xl: Platform.OS === 'web' ? 20 : 18,
    xxl: Platform.OS === 'web' ? 24 : 20,
    xxxl: Platform.OS === 'web' ? 30 : 24,
    xxxxl: Platform.OS === 'web' ? 36 : 28,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 2,
  },
  
  fontFamily: {
    regular: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : (Platform.OS === 'ios' ? 'System' : 'Roboto'),
    medium: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : (Platform.OS === 'ios' ? 'System' : 'Roboto'),
    bold: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : (Platform.OS === 'ios' ? 'System' : 'Roboto'),
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  shadows: {
    none: {},
    xs: createShadow(1),
    sm: createShadow(2),
    md: createShadow(4),
    lg: createShadow(8),
    xl: createShadow(12),
  },
  
  opacity: {
    disabled: 0.5,
    pressed: 0.8,
    overlay: 0.9,
  },
  
  zIndex: {
    base: 0,
    dropdown: 10,
    modal: 100,
    tooltip: 1000,
  },
  
  minHeight: {
    button: 44,
    input: Platform.OS === 'web' ? 48 : 44,
    touchTarget: 44,
  },
  
  maxWidth: {
    xs: 320,
    sm: 400,
    md: 600,
    lg: 800,
    xl: 1200,
  },
  
  iconSize: {
    xs: Platform.OS === 'web' ? 16 : 14,
    sm: Platform.OS === 'web' ? 20 : 18,
    md: Platform.OS === 'web' ? 24 : 22,
    lg: Platform.OS === 'web' ? 28 : 24,
    xl: Platform.OS === 'web' ? 32 : 28,
    xxl: Platform.OS === 'web' ? 36 : 32,
  },
};

// Helper functions for common style patterns
export const getUrgencyStyle = (urgency: 'high' | 'medium' | 'low') => {
  return theme.colors.urgency[urgency];
};

export const getStatusColor = (status: string) => {
  return theme.colors.status[status as keyof typeof theme.colors.status] || theme.colors.text.secondary;
};

export const getNotificationStyle = (type: 'info' | 'success' | 'warning' | 'error') => {
  const notification = theme.colors.notification;
  return {
    backgroundColor: notification[type],
    borderColor: notification[`${type}Border` as keyof typeof notification],
    color: notification[`${type}Text` as keyof typeof notification],
  };
};