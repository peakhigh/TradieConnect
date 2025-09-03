/**
 * Reusable authentication hook for marketplace applications
 * Provides authentication state management and operations
 */

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { 
  User, 
  AuthState, 
  LoginCredentials, 
  OTPVerification, 
  OnboardingData,
  AuthError 
} from '../types';
import { authService } from '../services/authService';
import { secureLog, secureError } from '../../../utils/logger';

interface AuthContextType extends AuthState {
  // Authentication operations
  sendOTP: (credentials: LoginCredentials) => Promise<string>;
  verifyOTP: (verification: OTPVerification) => Promise<User>;
  logout: () => Promise<void>;
  
  // User operations
  updateProfile: (profile: Partial<User['profile']>) => Promise<void>;
  updateSettings: (settings: Partial<User['settings']>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // Onboarding
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  
  // Verification
  uploadVerificationDocument: (type: string, file: File) => Promise<string>;
  
  // Utility
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  config?: {
    persistSession?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
  };
}

export const AuthProvider = ({ 
  children, 
  config = { 
    persistSession: true, 
    autoRefresh: true, 
    refreshInterval: 300000 // 5 minutes
  } 
}: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Auto-refresh user data
  useEffect(() => {
    if (config.autoRefresh && authState.isAuthenticated && authState.user) {
      const interval = setInterval(() => {
        refreshUser();
      }, config.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [authState.isAuthenticated, config.autoRefresh, config.refreshInterval]);

  const initializeAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const user = await authService.getCurrentUser();
      
      setAuthState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      secureError('Auth initialization failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  };

  const sendOTP = async (credentials: LoginCredentials): Promise<string> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const verificationId = await authService.sendOTP(credentials);
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return verificationId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      secureError('Send OTP failed:', errorMessage);
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  const verifyOTP = async (verification: OTPVerification): Promise<User> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const user = await authService.verifyOTP(verification);
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      secureLog('User authenticated successfully');
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      secureError('OTP verification failed:', errorMessage);
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await authService.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      secureLog('User logged out successfully');
    } catch (error) {
      secureError('Logout failed:', error);
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  const updateProfile = async (profile: Partial<User['profile']>): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');
    
    try {
      const updatedUser = await authService.updateProfile(authState.user.id, profile);
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      
      secureLog('Profile updated successfully');
    } catch (error) {
      secureError('Profile update failed:', error);
      throw error;
    }
  };

  const updateSettings = async (settings: Partial<User['settings']>): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');
    
    try {
      const updatedUser = await authService.updateSettings(authState.user.id, settings);
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      
      secureLog('Settings updated successfully');
    } catch (error) {
      secureError('Settings update failed:', error);
      throw error;
    }
  };

  const deleteAccount = async (): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');
    
    try {
      await authService.deleteAccount(authState.user.id);
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      secureLog('Account deleted successfully');
    } catch (error) {
      secureError('Account deletion failed:', error);
      throw error;
    }
  };

  const completeOnboarding = async (data: OnboardingData): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');
    
    try {
      const updatedUser = await authService.completeOnboarding(authState.user.id, data);
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      
      secureLog('Onboarding completed successfully');
    } catch (error) {
      secureError('Onboarding failed:', error);
      throw error;
    }
  };

  const uploadVerificationDocument = async (type: string, file: File): Promise<string> => {
    if (!authState.user) throw new Error('User not authenticated');
    
    try {
      const url = await authService.uploadVerificationDocument(authState.user.id, type, file);
      
      // Refresh user data to get updated verification status
      await refreshUser();
      
      secureLog('Verification document uploaded successfully');
      return url;
    } catch (error) {
      secureError('Document upload failed:', error);
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!authState.user) return;
    
    try {
      const user = await authService.getUser(authState.user.id);
      
      setAuthState(prev => ({
        ...prev,
        user,
      }));
    } catch (error) {
      secureError('User refresh failed:', error);
      // Don't throw error for refresh failures
    }
  };

  const clearError = (): void => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    sendOTP,
    verifyOTP,
    logout,
    updateProfile,
    updateSettings,
    deleteAccount,
    completeOnboarding,
    uploadVerificationDocument,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility hooks for common auth checks
export const useRequireAuth = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) return { isLoading: true };
  if (!isAuthenticated || !user) {
    throw new Error('Authentication required');
  }
  
  return { user, isLoading: false };
};

export const useRequireRole = (requiredRole: string) => {
  const { user } = useRequireAuth();
  
  if (user.role !== requiredRole) {
    throw new Error(`Role '${requiredRole}' required`);
  }
  
  return user;
};

export const useHasPermission = (permission: string) => {
  const { user } = useAuth();
  
  // This would be implemented based on your permission system
  // For now, return true for authenticated users
  return !!user;
};