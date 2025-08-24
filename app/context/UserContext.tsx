import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { ServiceRequest, Quote, Message } from '../types';

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

  // Listen to service requests - DISABLED due to Firestore permissions
  useEffect(() => {
    if (!user || user.userType !== 'customer') {
      setServiceRequests([]);
      return;
    }

    // TODO: Enable when Firestore rules are configured
    console.log('Service requests query disabled - Firestore permissions needed');
    setServiceRequests([]);
    
    // const requestsQuery = query(
    //   collection(db, 'serviceRequests'),
    //   where('customerId', '==', user.id),
    //   orderBy('createdAt', 'desc')
    // );
    // 
    // const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
    //   const requests = snapshot.docs.map(doc => ({
    //     id: doc.id,
    //     ...doc.data()
    //   })) as ServiceRequest[];
    //   setServiceRequests(requests);
    // });
    //
    // return unsubscribe;
  }, [user]);

  // Listen to quotes - DISABLED due to Firestore permissions
  useEffect(() => {
    if (!user) {
      setQuotes([]);
      return;
    }

    // TODO: Enable when Firestore rules are configured
    console.log('Quotes query disabled - Firestore permissions needed');
    setQuotes([]);
  }, [user, serviceRequests]);

  // Listen to messages - DISABLED due to Firestore permissions
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setUnreadMessageCount(0);
      return;
    }

    // TODO: Enable when Firestore rules are configured
    console.log('Messages query disabled - Firestore permissions needed');
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
