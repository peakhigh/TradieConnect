import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
} from '../services/firebase';
import { useAuth } from './AuthContext';
import { secureError } from '../utils/logger';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  itemId?: string;
  goto?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  unreadMessageCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
};

const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  // Optimistic local read overrides (instant UI on mobile where we don't subscribe live).
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const subscribe = Platform.OS === 'web';

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const handle = (snapshot: any) => {
      const list: AppNotification[] = snapshot.docs.map((d: any) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          title: data.title || '',
          message: data.message || data.body || '',
          type: data.type || 'general',
          itemId: data.itemId || data.referenceId || '',
          goto: data.goto || '',
          read: data.read ?? false,
          createdAt: toDate(data.createdAt),
        };
      });
      setNotifications(list);
      setLocalReadIds(new Set());
      setLoading(false);
    };

    if (subscribe) {
      const unsub = onSnapshot(q, handle, (e) => {
        secureError('Notifications subscription error:', e);
        setLoading(false);
      });
      return unsub;
    }

    // Mobile: one-shot read (push handles the live case; refresh on focus elsewhere).
    import('firebase/firestore').then(({ getDocs }) => {
      getDocs(q).then(handle).catch((e) => {
        secureError('Notifications fetch error:', e);
        setLoading(false);
      });
    });
  }, [user?.id, subscribe]);

  const merged = useMemo(() => {
    if (localReadIds.size === 0) return notifications;
    return notifications.map((n) => (localReadIds.has(n.id) ? { ...n, read: true } : n));
  }, [notifications, localReadIds]);

  const unreadCount = useMemo(() => merged.filter((n) => !n.read).length, [merged]);
  const unreadMessageCount = useMemo(
    () => merged.filter((n) => !n.read && n.type === 'chat_message').length,
    [merged]
  );

  const markAsRead = useCallback(async (id: string) => {
    setLocalReadIds((prev) => new Set(prev).add(id));
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      secureError('markAsRead error:', e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = merged.filter((n) => !n.read);
    setLocalReadIds((prev) => {
      const next = new Set(prev);
      unread.forEach((n) => next.add(n.id));
      return next;
    });
    await Promise.all(
      unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {}))
    );
  }, [merged]);

  const value: NotificationsContextType = {
    notifications: merged,
    unreadCount,
    unreadMessageCount,
    loading,
    markAsRead,
    markAllAsRead,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};
