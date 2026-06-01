import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { Platform } from 'react-native';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';

// --- State & Actions ---

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authIsReady: boolean;
  successMessage: string | null;
}

type AuthAction =
  | { type: 'AUTH_IS_READY'; payload: { user: User | null; firebaseUser: FirebaseUser | null } }
  | { type: 'LOGIN'; payload: { user: User; firebaseUser: FirebaseUser } }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SHOW_SUCCESS'; payload: string }
  | { type: 'CLEAR_SUCCESS' };

const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  loading: true,
  authIsReady: false,
  successMessage: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_IS_READY':
      return {
        ...state,
        user: action.payload.user,
        firebaseUser: action.payload.firebaseUser,
        loading: false,
        authIsReady: true,
      };
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        firebaseUser: action.payload.firebaseUser,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        firebaseUser: null,
        successMessage: null,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SHOW_SUCCESS':
      return { ...state, successMessage: action.payload };
    case 'CLEAR_SUCCESS':
      return { ...state, successMessage: null };
    default:
      return state;
  }
}

// --- Persistence helpers ---

function persistUser(userData: User | null) {
  if (Platform.OS === 'web') {
    if (userData) {
      localStorage.setItem('tradieapp_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('tradieapp_user');
    }
  }
}

function loadPersistedUser(): User | null {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem('tradieapp_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  return null;
}

// --- Context ---

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authIsReady: boolean;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  showSuccessMessage: (message: string) => void;
  successMessage: string | null;
  clearSuccessMessage: () => void;
  dispatch: React.Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load persisted user on mount
  useEffect(() => {
    const persisted = loadPersistedUser();
    if (persisted) {
      dispatch({ type: 'SET_USER', payload: persisted });
    }
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const userData = { id: fbUser.uid, ...userDoc.data() } as User;
            persistUser(userData);
            dispatch({ type: 'AUTH_IS_READY', payload: { user: userData, firebaseUser: fbUser } });
          } else {
            dispatch({ type: 'AUTH_IS_READY', payload: { user: null, firebaseUser: fbUser } });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          dispatch({ type: 'AUTH_IS_READY', payload: { user: null, firebaseUser: fbUser } });
        }
      } else {
        // No Firebase user — check localStorage
        const persisted = loadPersistedUser();
        dispatch({ type: 'AUTH_IS_READY', payload: { user: persisted, firebaseUser: null } });
      }
    });

    return unsubscribe;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      persistUser(null);
      dispatch({ type: 'LOGOUT' });

      if (Platform.OS === 'web') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const setUser = useCallback((userData: User | null) => {
    persistUser(userData);
    dispatch({ type: 'SET_USER', payload: userData });
  }, []);

  const refreshUser = useCallback(async () => {
    if (state.firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', state.firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = { id: state.firebaseUser.uid, ...userDoc.data() } as User;
          persistUser(userData);
          dispatch({ type: 'SET_USER', payload: userData });
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  }, [state.firebaseUser]);

  const showSuccessMessage = useCallback((message: string) => {
    dispatch({ type: 'SHOW_SUCCESS', payload: message });
  }, []);

  const clearSuccessMessage = useCallback(() => {
    dispatch({ type: 'CLEAR_SUCCESS' });
  }, []);

  const value: AuthContextType = {
    user: state.user,
    firebaseUser: state.firebaseUser,
    loading: state.loading,
    authIsReady: state.authIsReady,
    signOut,
    logout: signOut,
    setUser,
    refreshUser,
    showSuccessMessage,
    successMessage: state.successMessage,
    clearSuccessMessage,
    dispatch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
