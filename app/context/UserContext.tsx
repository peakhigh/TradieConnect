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

  // Listen to service requests
  useEffect(() => {
    if (!user || user.userType !== 'customer') {
      setServiceRequests([]);
      return;
    }

    console.log('Setting up service requests listener for user:', user.id);
    
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
      console.log('Loaded service requests from Firestore:', requests.length);
    }, (error) => {
      console.error('Error loading service requests:', error);
      setServiceRequests([]);
    });

    return unsubscribe;
  }, [user]);

  // Listen to quotes
  useEffect(() => {
    if (!user) {
      setQuotes([]);
      return;
    }

    let quotesQuery;
    
    if (user.userType === 'customer') {
      if (serviceRequests.length === 0) {
        setQuotes([]);
        return;
      }
      quotesQuery = query(
        collection(db, 'quotes'),
        where('serviceRequestId', 'in', serviceRequests.map(req => req.id)),
        orderBy('createdAt', 'desc')
      );
    } else if (user.userType === 'tradie') {
      quotesQuery = query(
        collection(db, 'quotes'),
        where('tradieId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
    } else {
      setQuotes([]);
      return;
    }

    const unsubscribe = onSnapshot(quotesQuery, (snapshot) => {
      const quotesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quote[];
      setQuotes(quotesData);
    });

    return unsubscribe;
  }, [user, serviceRequests]);

  // Listen to messages
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setUnreadMessageCount(0);
      return;
    }

    const messagesQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.id),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData);
      
      const unreadCount = messagesData.filter(msg => !msg.isRead).length;
      setUnreadMessageCount(unreadCount);
    });

    return unsubscribe;
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
