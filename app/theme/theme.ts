import { Platform } from 'react-native';
import { createShadow, createFontFamily } from './crossPlatform';

export const theme = {
  colors: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#93c5fd',
    secondary: '#64748b',
    success: '#16a34a',
    successLight: '#bbf7d0',
    warning: '#ca8a04',
    warningLight: '#fed7aa',
    error: '#dc2626',
    errorLight: '#fecaca',
    
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    surfaceTertiary: '#f3f4f6',
    
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
      disabled: '#d1d5db',
    },
    
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
      dark: '#9ca3af',
      focus: '#3b82f6',
    },
    
    status: {
      active: '#3b82f6',
      completed: '#16a34a',
      pending: '#ca8a04',
      cancelled: '#dc2626',
    },
    
    notification: {
      info: '#dbeafe',
      infoBorder: '#93c5fd',
      infoText: '#1e40af',
      success: '#f0fdf4',
      successBorder: '#bbf7d0',
      successText: '#166534',
      warning: '#fffbeb',
      warningBorder: '#fed7aa',
      warningText: '#92400e',
      error: '#fef2f2',
      errorBorder: '#fecaca',
      errorText: '#dc2626',
    },
    
    urgency: {
      high: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
        color: '#374151',
      },
      medium: {
        backgroundColor: '#fffbeb',
        borderColor: '#fed7aa',
        color: '#374151',
      },
      low: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        color: '#374151',
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