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

  useEffect(() => {
    if (!user) {
      setServiceRequests([]);
      setQuotes([]);
      setMessages([]);
      setUnreadMessageCount(0);
      return;
    }

    let unsubscribeRequests: (() => void) | undefined;
    let unsubscribeQuotes: (() => void) | undefined;
    let unsubscribeMessages: (() => void) | undefined;

    if (user.userType === 'customer') {
      // Listen to customer's service requests
      const requestsQuery = query(
        collection(db, 'serviceRequests'),
        where('customerId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ServiceRequest[];
        setServiceRequests(requests);
      });

      // Listen to quotes for customer's requests
      const quotesQuery = query(
        collection(db, 'quotes'),
        where('serviceRequestId', 'in', serviceRequests.map(req => req.id)),
        orderBy('createdAt', 'desc')
      );
      unsubscribeQuotes = onSnapshot(quotesQuery, (snapshot) => {
        const quotesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Quote[];
        setQuotes(quotesData);
      });
    } else if (user.userType === 'tradie') {
      // Listen to tradie's quotes
      const quotesQuery = query(
        collection(db, 'quotes'),
        where('tradieId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      unsubscribeQuotes = onSnapshot(quotesQuery, (snapshot) => {
        const quotesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Quote[];
        setQuotes(quotesData);
      });
    }

    // Listen to messages for all users
    const messagesQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.id),
      orderBy('timestamp', 'desc')
    );
    unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData);
      
      // Calculate unread message count
      const unreadCount = messagesData.filter(msg => !msg.isRead).length;
      setUnreadMessageCount(unreadCount);
    });

    return () => {
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribeQuotes) unsubscribeQuotes();
      if (unsubscribeMessages) unsubscribeMessages();
    };
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
