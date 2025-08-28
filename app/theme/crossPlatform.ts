import { Platform, StyleSheet } from 'react-native';

// Cross-platform style utilities
export const createCrossPlatformStyle = (webStyle: any, nativeStyle: any = {}) => {
  return Platform.OS === 'web' ? { ...nativeStyle, ...webStyle } : nativeStyle;
};

// Shadow utilities that work across platforms
export const createShadow = (elevation: number = 2) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0 ${elevation}px ${elevation * 2}px rgba(0, 0, 0, 0.1)`,
    };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevation },
    shadowOpacity: 0.1,
    shadowRadius: elevation * 2,
    elevation,
  };
};

// Text decoration that works cross-platform
export const createTextDecoration = (decoration: 'underline' | 'line-through' | 'none' = 'none') => {
  return Platform.OS === 'web' ? { textDecorationLine: decoration } : {};
};

// Responsive dimensions
export const createResponsiveStyle = (webStyle: any, mobileStyle: any = {}) => {
  return Platform.OS === 'web' ? webStyle : mobileStyle;
};

// Safe area handling
export const createSafeAreaStyle = () => {
  return Platform.OS === 'web' 
    ? { paddingTop: 0 }
    : { paddingTop: Platform.OS === 'ios' ? 44 : 24 };
};

// Font family handling
export const createFontFamily = (fontWeight: 'normal' | 'bold' | '600' | '500' = 'normal') => {
  if (Platform.OS === 'web') {
    return {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: fontWeight,
    };
  }
  return {
    fontWeight: fontWeight,
    ...(Platform.OS === 'ios' && {
      fontFamily: 'System',
    }),
  };
};

// Cursor styles for web
export const createCursorStyle = (cursor: 'pointer' | 'default' | 'text' = 'default') => {
  return Platform.OS === 'web' ? { cursor: cursor } : {};
};

// Outline styles for web accessibility
export const createOutlineStyle = () => {
  return Platform.OS === 'web' 
    ? { 
        outline: 'none',
        '&:focus': {
          outline: '2px solid #3b82f6',
          outlineOffset: '2px',
        }
      } 
    : {};
};