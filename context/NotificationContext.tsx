import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/api';
import { Notification } from '../services/api/models';

interface NotificationContextValue {
  unreadCount: number;
  notifications: Notification[];
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();
  const appState = useRef(AppState.currentState);

  const refresh = useCallback(async () => {
    try {
      const list = await notificationService.list();
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => !n.is_read).length);
    } catch {
      // Fail silently — badge just won't update
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead?.();
    } catch {
      // Best-effort
    }
    // Optimistically clear the badge immediately
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  useEffect(() => {
    // Only fetch if authenticated
    if (isAuthenticated) {
      refresh();
    } else {
      // Clear out if logged out
      setNotifications([]);
      setUnreadCount(0);
    }

    // Re-fetch when the app comes back to the foreground
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active' && isAuthenticated) {
        refresh();
      }
      appState.current = nextState;
    });

    const poller = isAuthenticated ? setInterval(refresh, 10000) : null;

    return () => {
      sub.remove();
      if (poller) clearInterval(poller);
    };
  }, [refresh, isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, refresh, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};
