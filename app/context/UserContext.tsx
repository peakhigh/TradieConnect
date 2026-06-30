import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { ServiceRequest, Quote } from '../types';
import { secureLog, secureError } from '../utils/logger';

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
  serviceRequests: ServiceRequest[];
  quotes: CustomerQuote[];
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
  const [quotes, setQuotes] = useState<CustomerQuote[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [roomsByRequest, setRoomsByRequest] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // --- Service requests (customer's own postings) ---
  useEffect(() => {
    if (!user || user.userType !== 'customer') {
      setServiceRequests([]);
      return;
    }

    secureLog('Subscribing to service requests for user:', user.id);

    const requestsQuery = query(
      collection(db, 'serviceRequests'),
      where('customerId', '==', user.id),
      orderBy('createdAt', 'desc')
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

  // --- Quotes to review (real `quotes` collection, scoped to this customer's requests) ---
  useEffect(() => {
    if (!user || user.userType !== 'customer') {
      setQuotes([]);
      return;
    }

    // serviceRequests subscription gives us the request IDs this customer owns.
    const requestIds = serviceRequests.map((r) => r.id).filter(Boolean);
    if (requestIds.length === 0) {
      setQuotes([]);
      return;
    }

    // Firestore `in` supports up to 30 values per query — chunk and merge.
    const chunks: string[][] = [];
    for (let i = 0; i < requestIds.length; i += 30) {
      chunks.push(requestIds.slice(i, i + 30));
    }

    const merged = new Map<string, CustomerQuote>();
    const unsubscribers = chunks.map((chunk) => {
      const quotesQuery = query(
        collection(db, 'quotes'),
        where('serviceRequestId', 'in', chunk),
        where('status', 'in', ['quoted', 'accepted', 'rejected'])
      );

      return onSnapshot(quotesQuery, (snapshot) => {
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          merged.set(doc.id, {
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
          });
        });
        // Newest first
        const all = Array.from(merged.values()).sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        setQuotes(all);
      }, (error) => {
        secureError('Error loading quotes:', error);
      });
    });

    return () => unsubscribers.forEach((u) => u());
  }, [user?.id, user?.userType, serviceRequests]);

  // --- Unread message count (from real chatRooms) ---
  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }

    const isTradie = user.userType === 'tradie';
    const fieldToQuery = isTradie ? 'tradieId' : 'customerId';
    const unreadField = isTradie ? 'unreadByTradie' : 'unreadByCustomer';

    if (user.userType === 'admin') {
      setUnreadMessageCount(0);
      return;
    }

    const roomsQuery = query(
      collection(db, 'chatRooms'),
      where(fieldToQuery, '==', user.id)
    );

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      let total = 0;
      const byRequest: Record<string, number> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        total += data[unreadField] || 0;
        const reqId = data.serviceRequestId;
        if (reqId) byRequest[reqId] = (byRequest[reqId] || 0) + 1;
      });
      setUnreadMessageCount(total);
      setRoomsByRequest(byRequest);
    }, (error) => {
      secureError('Error loading unread message count:', error);
      setUnreadMessageCount(0);
      setRoomsByRequest({});
    });

    return unsubscribe;
  }, [user?.id, user?.userType]);

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
    unreadMessageCount,
    quotesByRequest,
    roomsByRequest,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
