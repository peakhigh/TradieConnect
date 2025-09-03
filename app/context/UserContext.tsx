import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { ServiceRequest, Quote, Message } from '../types';
import { secureLog, secureError } from '../utils/logger';

interface UserContextType {
  serviceRequests: ServiceRequest[];
  quotes: Quote[];
  messages: Message[];
  unreadMessageCount: number;
  refreshData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Listen to service requests
  useEffect(() => {
    if (!user || user.userType !== 'customer') {
      setServiceRequests([]);
      return;
    }

    secureLog('Setting up service requests listener for user:', user.id);
    
    const requestsQuery = query(
      collection(db, 'serviceRequests'),
      where('customerId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          preferredDates: data.preferredDates ? {
            earliest: data.preferredDates.earliest?.toDate ? data.preferredDates.earliest.toDate() : new Date(data.preferredDates.earliest),
            latest: data.preferredDates.latest?.toDate ? data.preferredDates.latest.toDate() : new Date(data.preferredDates.latest)
          } : null,
        };
      }) as ServiceRequest[];
      setServiceRequests(requests);
      secureLog('Loaded service requests from Firestore:', requests.length);
    }, (error) => {
      secureError('Error loading service requests:', error);
      setServiceRequests([]);
    });

    return unsubscribe;
  }, [user]);

  // Mock data for quotes and messages since collections don't exist yet
  useEffect(() => {
    setQuotes([]);
    setMessages([]);
    setUnreadMessageCount(0);
  }, [user]);

  const refreshData = () => {
    // This will trigger the useEffect to refresh data
  };

  const value: UserContextType = {
    serviceRequests,
    quotes,
    messages,
    unreadMessageCount,
    refreshData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
