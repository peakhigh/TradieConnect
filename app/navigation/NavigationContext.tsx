import React, { createContext, useContext } from 'react';

interface AppNavigationContextType {
  navigate: (screen: string, params?: any) => void;
  activeRoute: string;
}

const AppNavigationContext = createContext<AppNavigationContextType>({
  navigate: () => {},
  activeRoute: 'Dashboard',
});

export const useAppNavigation = () => useContext(AppNavigationContext);

export const AppNavigationProvider = AppNavigationContext.Provider;

/**
 * Hook that provides navigation.navigate() that works both inside
 * React Navigation navigators AND our custom tab/sidebar layout.
 * 
 * Use this instead of useNavigation() in screens.
 */
export function useScreenNavigation() {
  const appNav = useAppNavigation();
  return {
    navigate: (screen: string, params?: any) => {
      appNav.navigate(screen, params);
    },
    goBack: () => {
      appNav.navigate('Dashboard');
    },
  };
}

export default AppNavigationContext;
