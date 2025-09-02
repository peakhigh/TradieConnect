import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, Customer, Tradie } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  showSuccessMessage: (message: string) => void;
  successMessage: string | null;
  clearSuccessMessage: () => void;
}

// Custom setUser function that also saves to localStorage
const setUserWithPersistence = (setUser: React.Dispatch<React.SetStateAction<User | null>>) => {
  return (userData: User | null) => {
    setUser(userData);
    if (Platform.OS === 'web') {
      if (userData) {
        localStorage.setItem('tradieapp_user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('tradieapp_user');
      }
    }
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user from localStorage on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const storedUser = localStorage.getItem('tradieapp_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
            setUser(userData);
            
            // Also save to localStorage for persistence
            if (Platform.OS === 'web') {
              localStorage.setItem('tradieapp_user', JSON.stringify(userData));
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        // Only check localStorage if no Firebase user
        if (Platform.OS === 'web') {
          const storedUser = localStorage.getItem('tradieapp_user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserWithPersistence(setUser)(null);
      setFirebaseUser(null);
      
      // Redirect to static website on web platform
      if (Platform.OS === 'web') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
  };

  const clearSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
          setUser(userData);
          
          if (Platform.OS === 'web') {
            localStorage.setItem('tradieapp_user', JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signOut,
    setUser: setUserWithPersistence(setUser),
    refreshUser,
    showSuccessMessage,
    successMessage,
    clearSuccessMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
