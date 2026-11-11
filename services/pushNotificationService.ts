import { LogBox, Platform, Vibration } from 'react-native';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Suppress Expo Go SDK 53/54 remote push deprecation notice from triggering LogBox red screen
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { apiClient } from './api/client';

// Configure foreground notification behavior:
// Displays the standard native Android system heads-up drop-down banner (matching Facebook, Gmail, etc.)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false, // Prevents Android's built-in 2-beat notification chime
    shouldSetBadge: true,
    shouldShowBanner: true, // Native system drop-down banner
    shouldShowList: true,   // Kept in notification shade / tray
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export const EMERGENCY_CHANNEL_ID = 'firesight-emergency-alerts-v5';

let sirenPlayer: AudioPlayer | null = null;

/**
 * Plays an authentic loud fire emergency wail siren.
 * Works natively in both Expo Go and Standalone builds.
 */
export async function playEmergencySiren(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    if (!sirenPlayer) {
      sirenPlayer = createAudioPlayer(require('../assets/sounds/fire_siren.mp3'));
    }

    sirenPlayer.volume = 1.0;
    sirenPlayer.loop = false;
    await sirenPlayer.seekTo(0);
    sirenPlayer.play();
  } catch (err) {
    console.warn('[Audio] Failed to play emergency siren:', err);
  }
}

/**
 * Immediately stops any playing siren audio and vibration.
 */
export function stopEmergencySiren(): void {
  try {
    if (sirenPlayer && sirenPlayer.playing) {
      sirenPlayer.pause();
    }
    Vibration.cancel();
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Triggers the tactical 14.0s Fire Station dispatch vibration cadence:
 * 3 sharp staccato attack pulses, 2 heavy station horn pulses, followed by 5 deep mechanical wails.
 */
export function triggerUrgentVibration(): void {
  if (Platform.OS === 'web') return;

  try {
    Vibration.vibrate([
      0,
      220, 80, 220, 80, 220, 180, // 3 Staccato Attack Bursts (1.0s)
      1100, 80, 1100, 100,         // 2 Muscular Station Horn Pulses (2.2s)
      2000, 100, 2000, 100, 2000, 100, 2000, 100, 2000 // 5 Heavy Mechanical Wails (~10.5s) -> Total ~13.8s ≈ 14s
    ]);
  } catch {
    // Ignore vibration failure
  }
}

let gentleChimePlayer: AudioPlayer | null = null;

/**
 * Plays a soft, pleasant notification chime for routine notifications
 * (e.g. resident report confirmation, status updates).
 */
export async function playGentleChime(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });

    if (!gentleChimePlayer) {
      gentleChimePlayer = createAudioPlayer(require('../assets/sounds/gentle_chime.wav'));
    }

    gentleChimePlayer.volume = 0.65;
    gentleChimePlayer.loop = false;
    await gentleChimePlayer.seekTo(0);
    gentleChimePlayer.play();
  } catch (err) {
    console.warn('[Audio] Failed to play gentle chime:', err);
  }
}

/**
 * Triggers a clean double-tap haptic confirmation pulse for routine notifications.
 */
export function triggerStandardVibration(): void {
  if (Platform.OS === 'web') return;

  try {
    Vibration.vibrate([0, 120, 80, 160]);
  } catch {
    // Ignore vibration failure
  }
}

/**
 * Dismisses any active status bar notification matching the given report ID.
 */
export async function dismissNotificationByReportId(reportId: number): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const item of presented) {
      const id = Number(item.request?.content?.data?.report_id);
      if (id === reportId) {
        await Notifications.dismissNotificationAsync(item.request.identifier);
      }
    }
  } catch (err) {
    console.warn('[PushNotificationService] Failed to dismiss notification by report ID:', err);
  }
}

/**
 * Dismisses all FireSight notifications currently displayed in the phone's notification shade.
 */
export async function dismissAllPresentedNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (err) {
    console.warn('[PushNotificationService] Failed to dismiss all notifications:', err);
  }
}

/**
 * Configure Android notification channels for high-priority emergency alerts.
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(EMERGENCY_CHANNEL_ID, {
      name: 'FireSight Emergency Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 1000, 100, 2000, 100, 1400, 150, 1400, 150, 1400, 150, 1400, 150, 1400],
      lightColor: '#FF4500',
      sound: null, // Silence Android's generic system "ding" so only our NDRRMC siren plays
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
    });
  }
}

/**
 * Present an immediate local status bar notification with sound and vibration.
 * Works 100% in both Expo Go and Standalone builds.
 */
export async function presentLocalNotification({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: false, // Disables Android's default notification ding chime
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: data || {},
      },
      trigger: {
        channelId: EMERGENCY_CHANNEL_ID,
      },
    });
  } catch (err) {
    console.warn('[PushNotificationService] Failed to present local notification:', err);
  }
}

/**
 * Requests push permission and registers the device's Expo push token with the backend.
 * In Expo Go on Android (SDK 53+), remote push tokens are disabled by Expo; local notifications
 * are used instead until a development build or APK is created.
 */
export async function registerPushTokenWithBackend(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Remote push tokens inside generic Expo Go were removed in SDK 53/54 by Expo
    // to comply with Google Play FCM policies.
    const inExpoGo =
      (typeof isRunningInExpoGo === 'function' && isRunningInExpoGo()) ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      Constants.appOwnership === 'expo';

    if (inExpoGo) {
      console.info(
        '[PushNotificationService] Running in Expo Go: Remote push token registration skipped. Status bar notifications are powered locally.'
      );
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.info(
        '[PushNotificationService] No EAS projectId configured in app.json. Remote token registration skipped.'
      );
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data;

    if (token) {
      await apiClient.post('/notifications/device-token', { push_token: token });
    }

    return token;
  } catch (error) {
    console.warn('[PushNotificationService] Push token registration skipped:', error);
    return null;
  }
}

/**
 * Subscribes to notification response (when a user taps a status bar / banner notification).
 */
export function subscribeToNotificationResponse(
  onNavigate: (reportId: number, type?: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response?.notification?.request?.content?.data;
    if (data?.report_id) {
      const reportId = Number(data.report_id);
      if (!isNaN(reportId) && reportId > 0) {
        onNavigate(reportId, typeof data.type === 'string' ? data.type : undefined);
      }
    }
  });

  return () => {
    subscription.remove();
  };
}
