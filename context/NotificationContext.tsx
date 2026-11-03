import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from './AuthContext';
import { secureStorage } from '../services/storage/secureStorage';
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
  const [bannerQueue, setBannerQueue] = useState<CompactBannerData[]>([]);
  const activeBanner = bannerQueue.length > 0 ? bannerQueue[0] : null;
  const { isAuthenticated, user } = useAuth();
  const appState = useRef(AppState.currentState);

  const dismissEmergencyAlert = useCallback(() => {
    stopEmergencySiren();
    setBannerQueue((prev) => prev.slice(1));
  }, []);

  // Pro-app audio & haptic orchestration:
  // When a banner drops (or cascades to next in queue), cut previous sound immediately
  // and trigger the new sound/vibration immediately without waiting.
  const activeBannerKey = activeBanner
    ? activeBanner.id || `${activeBanner.reportId}-${activeBanner.title}`
    : null;

  useEffect(() => {
    if (!activeBanner) {
      stopEmergencySiren();
      return;
    }

    // Cut off previous sound immediately
    stopEmergencySiren();

    // Trigger fresh audio & haptics for the dropping banner
    if (activeBanner.isEmergency) {
      playEmergencySiren();
      triggerUrgentVibration();
    } else {
      playGentleChime();
      triggerStandardVibration();
    }
  }, [activeBannerKey]);

  const triggerEmergencyAlert = useCallback(
    (alert: {
      reportId: number;
      title: string;
      message: string;
      location?: string;
      notificationType?: string;
      isEmergency?: boolean;
    }) => {
      // Strictly: Only incoming fire incident alerts (incident_alert) received by BFP personnel
      // get the tactical siren and urgent alarm vibration.
      const isBfpEmergency =
        user?.role === 'bfp_personnel' &&
        (alert.isEmergency !== undefined
          ? Boolean(alert.isEmergency)
          : alert.notificationType === 'incident_alert' ||
            Boolean(alert.title && /fire|incident/i.test(alert.title)));

      // Enqueue compact banner with unique timestamped ID
      const bannerItem: CompactBannerData = {
        id: `alert-${alert.reportId}-${Date.now()}-${Math.random()}`,
        reportId: alert.reportId,
        title: alert.title,
        message: alert.message,
        location: alert.location,
        isEmergency: isBfpEmergency,
      };

      setBannerQueue((prev) => {
        // Preempt routine non-emergency banner immediately if a fire incident emergency arrives
        if (isBfpEmergency && prev.length > 0 && !prev[0].isEmergency) {
          return [bannerItem, ...prev];
        }
        // If a routine notification arrives while another routine banner is resting on screen,
        // instantly drop over it like social media apps (Messenger, WhatsApp, Instagram)
        if (!isBfpEmergency && prev.length > 0 && !prev[0].isEmergency) {
          return [bannerItem, ...prev.slice(1)];
        }
        return [...prev, bannerItem];
      });

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

      // 1. Dismiss any banners matching this report and dismiss phone status bar notification
      stopEmergencySiren();
      setBannerQueue((prev) => prev.filter((b) => b.reportId !== reportId));
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
    []
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

  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!user?.user_id || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      const list = await notificationService.list();
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => !n.is_read).length);

      if (list.length > 0) {
        const newestId = Math.max(...list.map((n: Notification) => n.notification_id));
        const lastPresentedId = await secureStorage.getLastPresentedNotifId(user.user_id);

        if (lastPresentedId === 0) {
          // On first launch / fresh login, establish watermark silently so historical
          // notifications do NOT spam the user with past banners or sirens.
          await secureStorage.setLastPresentedNotifId(user.user_id, newestId);
        } else if (newestId > lastPresentedId) {
          // Brand-new notifications arrived that have never been presented on this hardware
          const unpresentedAlerts = list
            .filter((n: Notification) => n.notification_id > lastPresentedId && !n.is_read)
            .sort((a, b) => a.notification_id - b.notification_id);

          if (unpresentedAlerts.length > 0) {
            // Advance watermark immediately
            await secureStorage.setLastPresentedNotifId(user.user_id, newestId);

            // Cap the in-app queue to top 3 newest alerts to prevent notification fatigue
            const alertsToQueue = unpresentedAlerts.slice(-3);

            const queueItems: CompactBannerData[] = alertsToQueue.map((alert, idx) => {
              const isBfpEmergency =
                user?.role === 'bfp_personnel' &&
                (alert.notification_type === 'incident_alert' ||
                  Boolean(alert.title && /fire|incident/i.test(alert.title)));
              return {
                id: `sync-${alert.notification_id}-${Date.now()}-${idx}`,
                reportId: alert.report_id ?? 0,
                title: alert.title,
                message: alert.message,
                isEmergency: isBfpEmergency,
              };
            });

            setBannerQueue((prev) => {
              const hasEmergency = queueItems.some((q) => q.isEmergency);
              if (hasEmergency && prev.length > 0 && !prev[0].isEmergency) {
                const emergencies = queueItems.filter((q) => q.isEmergency);
                const routine = queueItems.filter((q) => !q.isEmergency);
                return [...emergencies, ...prev, ...routine];
              }
              return [...prev, ...queueItems];
            });

            // Post all unpresented alerts to phone system notification tray
            for (const alert of unpresentedAlerts) {
              const isBfpIncident =
                user?.role === 'bfp_personnel' &&
                (alert.notification_type === 'incident_alert' ||
                  (alert.title && /fire|incident/i.test(alert.title)));
              presentLocalNotification({
                title: alert.title,
                body: alert.message,
                data: {
                  report_id: alert.report_id,
                  type: isBfpIncident ? 'incident_alert' : 'status_update',
                },
              });
            }
          }
        }
      }
    } catch {
      // Fail silently — badge just won't update
    } finally {
      isRefreshingRef.current = false;
    }
  }, [user?.user_id, user?.role]);

  const markAllRead = useCallback(async () => {
    stopEmergencySiren();
    setBannerQueue([]);
    await dismissAllPresentedNotifications();
    try {
      await notificationService.markAllRead?.();
    } catch {
      // Best-effort
    }
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

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
      setBannerQueue([]);
      stopEmergencySiren();
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
        hasMoreInQueue={bannerQueue.length > 1}
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
