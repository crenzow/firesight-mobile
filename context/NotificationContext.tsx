import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/api';
import { Notification } from '../services/api/models';
import {
  setupNotificationChannels,
  registerPushTokenWithBackend,
  subscribeToNotificationResponse,
  presentLocalNotification,
  playEmergencySiren,
  stopEmergencySiren,
  triggerUrgentVibration,
  playGentleChime,
  triggerStandardVibration,
  dismissNotificationByReportId,
  dismissAllPresentedNotifications,
} from '../services/pushNotificationService';
import {
  CompactNotificationBanner,
  CompactBannerData,
} from '../components/ui/CompactNotificationBanner';

interface NotificationContextValue {
  unreadCount: number;
  notifications: Notification[];
  refresh: () => Promise<void>;
  markRead: (notificationId: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  markReportRead: (reportId: number) => Promise<void>;
  triggerEmergencyAlert: (alert: {
    reportId: number;
    title: string;
    message: string;
    location?: string;
    notificationType?: string;
    isEmergency?: boolean;
  }) => void;
  dismissEmergencyAlert: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentPath = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeBanner, setActiveBanner] = useState<CompactBannerData | null>(null);
  const { isAuthenticated, user } = useAuth();
  const appState = useRef(AppState.currentState);
  const lastSeenNotifId = useRef<number | null>(null);

  const dismissEmergencyAlert = useCallback(() => {
    stopEmergencySiren();
    setActiveBanner(null);
  }, []);

  const triggerEmergencyAlert = useCallback(
    (alert: {
      reportId: number;
      title: string;
      message: string;
      location?: string;
      notificationType?: string;
      isEmergency?: boolean;
    }) => {
      // 1. Show compact banner
      setActiveBanner({
        reportId: alert.reportId,
        title: alert.title,
        message: alert.message,
        location: alert.location,
      });

      // Strictly: Only incoming fire incident alerts (incident_alert) received by BFP personnel
      // get the tactical siren and urgent alarm vibration.
      const isBfpEmergency =
        user?.role === 'bfp_personnel' &&
        (alert.isEmergency !== undefined
          ? Boolean(alert.isEmergency)
          : alert.notificationType === 'incident_alert');

      if (isBfpEmergency) {
        playEmergencySiren();
        triggerUrgentVibration();
      } else {
        // Routine alerts (resident confirmations, status updates) play a simple gentle chime
        playGentleChime();
        triggerStandardVibration();
      }

      // Keep in phone's notification tray for history
      presentLocalNotification({
        title: alert.title,
        body: alert.message,
        data: { report_id: alert.reportId, type: isBfpEmergency ? 'incident_alert' : 'status_update' },
      });
    },
    [user?.role]
  );

  const markReportRead = useCallback(
    async (reportId: number) => {
      if (!reportId || reportId <= 0) return;

      // 1. Dismiss in-app emergency alert/banner and phone status bar notification
      dismissEmergencyAlert();
      await dismissNotificationByReportId(reportId);

      // 2. Find any matching unread notifications in local state
      let matchingCount = 0;
      const idsToMark: number[] = [];

      setNotifications((prev) =>
        prev.map((n) => {
          if (Number(n.report_id) === reportId && !n.is_read) {
            matchingCount++;
            idsToMark.push(n.notification_id);
            return { ...n, is_read: true };
          }
          return n;
        })
      );

      if (matchingCount > 0) {
        setUnreadCount((prev) => Math.max(0, prev - matchingCount));
        for (const id of idsToMark) {
          try {
            await notificationService.markRead(id);
          } catch {
            // Best effort
          }
        }
      }
    },
    [dismissEmergencyAlert]
  );

  const handleBannerPress = useCallback(
    async (reportId: number) => {
      dismissEmergencyAlert();
      if (reportId > 0) {
        await markReportRead(reportId);
        // Option A: Remember exact tab the user was on when the banner appeared
        const backSource =
          currentPath || (user?.role === 'bfp_personnel' ? '/(bfp)/dashboard' : '/(resident)/home');

        if (user?.role === 'bfp_personnel') {
          router.push({
            pathname: '/(bfp)/incidents/[id]',
            params: { id: String(reportId), from: backSource },
          } as any);
        } else {
          router.push({
            pathname: '/(resident)/reports/[id]',
            params: { id: String(reportId), from: backSource },
          } as any);
        }
      }
    },
    [user?.role, dismissEmergencyAlert, markReportRead, currentPath]
  );

  const refresh = useCallback(async () => {
    try {
      const list = await notificationService.list();
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => !n.is_read).length);

      if (list.length > 0) {
        const newestId = Math.max(...list.map((n: Notification) => n.notification_id));

        if (lastSeenNotifId.current !== null && newestId > lastSeenNotifId.current) {
          // New notifications arrived while user is active
          const newAlerts = list.filter(
            (n: Notification) => n.notification_id > (lastSeenNotifId.current ?? 0) && !n.is_read
          );

          for (const alert of newAlerts) {
            // Strictly check: BFP Personnel receiving new pending fire report
            const isBfpPendingIncident =
              user?.role === 'bfp_personnel' &&
              alert.notification_type === 'incident_alert';

            triggerEmergencyAlert({
              reportId: alert.report_id ?? 0,
              title: alert.title,
              message: alert.message,
              notificationType: alert.notification_type,
              isEmergency: isBfpPendingIncident,
            });
          }
        }

        lastSeenNotifId.current = newestId;
      }
    } catch {
      // Fail silently — badge just won't update
    }
  }, [triggerEmergencyAlert, user?.role]);

  const markAllRead = useCallback(async () => {
    dismissEmergencyAlert();
    await dismissAllPresentedNotifications();
    try {
      await notificationService.markAllRead?.();
    } catch {
      // Best-effort
    }
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [dismissEmergencyAlert]);

  const markRead = useCallback(async (notificationId: number) => {
    let matchedReportId: number | null = null;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.notification_id === notificationId) {
          if (n.report_id) matchedReportId = Number(n.report_id);
          return { ...n, is_read: true };
        }
        return n;
      })
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Vice-versa: Dismiss phone tray push notification and banner when read in-app
    if (matchedReportId) {
      await dismissNotificationByReportId(matchedReportId);
      if (activeBanner?.reportId === matchedReportId) {
        dismissEmergencyAlert();
      }
    }

    try {
      await notificationService.markRead(notificationId);
    } catch {
      // Fail silently
    }
  }, [activeBanner?.reportId, dismissEmergencyAlert]);

  useEffect(() => {
    setupNotificationChannels();

    const unsubResponse = subscribeToNotificationResponse(async (reportId) => {
      dismissEmergencyAlert();
      if (reportId > 0) {
        await markReportRead(reportId);
      }
      refresh();
      // Outside the app: after reviewing the incident, pressing back drops the user into Home/Dashboard
      const homeRoute = user?.role === 'bfp_personnel' ? '/(bfp)/dashboard' : '/(resident)/home';
      if (user?.role === 'bfp_personnel') {
        router.push({
          pathname: '/(bfp)/incidents/[id]',
          params: { id: String(reportId), from: homeRoute },
        } as any);
      } else {
        router.push({
          pathname: '/(resident)/reports/[id]',
          params: { id: String(reportId), from: homeRoute },
        } as any);
      }
    });

    if (isAuthenticated) {
      refresh();
      registerPushTokenWithBackend();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active' && isAuthenticated) {
        refresh();
      }
      appState.current = nextState;
    });

    const poller = isAuthenticated ? setInterval(refresh, 10000) : null;

    return () => {
      sub.remove();
      unsubResponse();
      if (poller) clearInterval(poller);
    };
  }, [refresh, isAuthenticated, user?.role, dismissEmergencyAlert, markReportRead]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        refresh,
        markRead,
        markAllRead,
        markReportRead,
        triggerEmergencyAlert,
        dismissEmergencyAlert,
      }}
    >
      {children}
      <CompactNotificationBanner
        data={activeBanner}
        onPress={handleBannerPress}
        onDismiss={dismissEmergencyAlert}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};
