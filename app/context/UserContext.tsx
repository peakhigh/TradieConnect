import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { ServiceRequest } from '../types';
import { secureLog, secureError } from '../utils/logger';
import { ChatRoom, subscribeToChatRooms } from '../services/chatService';

/** Request statuses the customer still acts on. Completed/cancelled live in History. */
export const OPEN_REQUEST_STATUSES = ['new', 'quoted', 'assigned'];
const MAX_OPEN_REQUESTS = 100;
const MAX_QUOTES = 200;

/**
 * A quote as surfaced to the customer for review. Mapped from the real `quotes`
 * collection (lifecycle docs) into a UI-friendly shape. Only docs that have
 * actually been quoted (status quoted/accepted/rejected) are included — pure
 * `unlocked` rows are not shown to the customer.
 */
export interface CustomerQuote {
  id: string;
  serviceRequestId: string;
  tradieId: string;
  tradieName: string;
  tradieRating: number;
  totalPrice: number;
  materialsCost: number;
  laborCost: number;
  timelineDays: number;
  estimatedStartDate: Date | null;
  estimatedCompletionDate: Date | null;
  notes: string;
  status: 'quoted' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface UserContextType {
  /** The customer's open requests (new / quoted / assigned), newest first. */
  serviceRequests: ServiceRequest[];
  /** Quotes on the customer's open requests, newest first. */
  quotes: CustomerQuote[];
  /** The user's chat rooms (customer or tradie), most recent activity first. */
  chatRooms: ChatRoom[];
  chatRoomsLoading: boolean;
  unreadMessageCount: number;
  /** Number of received quotes per serviceRequestId (drives the "Interests" count). */
  quotesByRequest: Record<string, number>;
  /** Number of chat rooms per serviceRequestId (drives the "Messages" count). */
  roomsByRequest: Record<string, number>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [allQuotes, setAllQuotes] = useState<CustomerQuote[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatRoomsLoading, setChatRoomsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // --- Service requests (customer's own postings) ---
  useEffect(() => {
    if (!user || user.userType !== 'customer') {
      setServiceRequests([]);
      setLoading(false);
      return;
    }

    secureLog('Subscribing to service requests for user:', user.id);
    setLoading(true);

    const requestsQuery = query(
      collection(db, 'serviceRequests'),
      where('customerId', '==', user.id),
      where('status', 'in', OPEN_REQUEST_STATUSES),
      orderBy('createdAt', 'desc'),
      limit(MAX_OPEN_REQUESTS)
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
          preferredDates: data.preferredDates
            ? {
                earliest: toDate(data.preferredDates.earliest),
                latest: toDate(data.preferredDates.latest),
              }
            : null,
        };
      }) as unknown as ServiceRequest[];
      setServiceRequests(requests);
      setLoading(false);
      secureLog('Loaded service requests:', requests.length);
    }, (error) => {
      secureError('Error loading service requests:', error);
      setServiceRequests([]);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.id, user?.userType]);

  // --- Quotes on this customer's requests ---
  // One listener keyed on customerId (denormalized onto quotes), so it doesn't
  // restart every time a request doc changes.
  useEffect(() => {
    if (!user || user.userType !== 'customer') {
      setAllQuotes([]);
      return;
    }

    const quotesQuery = query(
      collection(db, 'quotes'),
      where('customerId', '==', user.id),
      where('status', 'in', ['quoted', 'accepted', 'rejected']),
      limit(MAX_QUOTES)
    );

    return onSnapshot(quotesQuery, (snapshot) => {
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          serviceRequestId: data.serviceRequestId || '',
          tradieId: data.tradieId || '',
          tradieName: data.tradieName || 'Tradie',
          tradieRating: data.tradieRating || 0,
          totalPrice: data.totalPrice || 0,
          materialsCost: data.materialsCost || 0,
          laborCost: data.laborCost || 0,
          timelineDays: data.timelineDays || 0,
          estimatedStartDate: toDate(data.estimatedStartDate),
          estimatedCompletionDate: toDate(data.estimatedCompletionDate),
          notes: data.notes || '',
          status: data.status,
          createdAt: toDate(data.quotedAt) || toDate(data.createdAt) || new Date(),
        } as CustomerQuote;
      });
      // Newest first
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setAllQuotes(list);
    }, (error) => {
      secureError('Error loading quotes:', error);
      setAllQuotes([]);
    });
  }, [user?.id, user?.userType]);

  // Only quotes on requests that are still open (the listener also returns
  // accepted quotes of completed jobs).
  const quotes = useMemo(() => {
    const openIds = new Set(serviceRequests.map((r) => r.id));
    return allQuotes.filter((q) => openIds.has(q.serviceRequestId));
  }, [allQuotes, serviceRequests]);

  // --- Chat rooms (shared by the Messages screen, badges and request cards) ---
  useEffect(() => {
    if (!user || user.userType === 'admin') {
      setChatRooms([]);
      setChatRoomsLoading(false);
      return;
    }
    setChatRoomsLoading(true);
    return subscribeToChatRooms(
      user.id,
      user.userType,
      (rooms) => {
        setChatRooms(rooms);
        setChatRoomsLoading(false);
      },
      (error) => {
        secureError('Error loading chat rooms:', error);
        setChatRooms([]);
        setChatRoomsLoading(false);
      }
    );
  }, [user?.id, user?.userType]);

  const { unreadMessageCount, roomsByRequest } = useMemo(() => {
    const isTradie = user?.userType === 'tradie';
    let total = 0;
    const byRequest: Record<string, number> = {};
    chatRooms.forEach((room) => {
      total += (isTradie ? room.unreadByTradie : room.unreadByCustomer) || 0;
      if (room.serviceRequestId) {
        byRequest[room.serviceRequestId] = (byRequest[room.serviceRequestId] || 0) + 1;
      }
    });
    return { unreadMessageCount: total, roomsByRequest: byRequest };
  }, [chatRooms, user?.userType]);

  // Quotes received per request (for the "Interests" count on request cards).
  const quotesByRequest = useMemo(() => {
    const map: Record<string, number> = {};
    quotes.forEach((q) => {
      if (q.serviceRequestId) map[q.serviceRequestId] = (map[q.serviceRequestId] || 0) + 1;
    });
    return map;
  }, [quotes]);

  const value: UserContextType = {
    serviceRequests,
    quotes,
    chatRooms,
    chatRoomsLoading,
    unreadMessageCount,
    quotesByRequest,
    roomsByRequest,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
