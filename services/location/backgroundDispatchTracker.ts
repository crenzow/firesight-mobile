import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { incidentService } from '../api/incidentService';

export const BACKGROUND_DISPATCH_TASK = 'FIRESIGHT_BACKGROUND_DISPATCH_LOCATION_TASK';
const ACTIVE_DISPATCH_IDS_KEY = '@firesight_active_dispatch_ids';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let lastBackgroundPingTime = 0;

// Define background task at the root module scope (outside React components)
TaskManager.defineTask(BACKGROUND_DISPATCH_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[BackgroundDispatchTask] Error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations?: Location.LocationObject[] };
    if (!locations || locations.length === 0) return;

    const latest = locations[locations.length - 1];

    // Throttle background calls to at most once every 3 seconds
    const now = Date.now();
    if (now - lastBackgroundPingTime < 3000) {
      return;
    }
    lastBackgroundPingTime = now;

    try {
      const stored = await AsyncStorage.getItem(ACTIVE_DISPATCH_IDS_KEY);
      let reportIds: number[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            reportIds = parsed;
          } else if (typeof parsed === 'number') {
            reportIds = [parsed];
          }
        } catch {
          const single = parseInt(stored, 10);
          if (!isNaN(single)) reportIds = [single];
        }
      }

      if (reportIds.length > 0) {
        const payload = {
          latitude: latest.coords.latitude,
          longitude: latest.coords.longitude,
          heading: latest.coords.heading != null && latest.coords.heading >= 0 ? latest.coords.heading : null,
          speed: latest.coords.speed != null && latest.coords.speed >= 0 ? latest.coords.speed : null,
        };

        await Promise.allSettled(
          reportIds.map((id) => incidentService.updateLocation(id, payload))
        );
      }
    } catch (err) {
      console.warn('[BackgroundDispatchTask] Failed to stream location in background:', err);
    }
  }
});

/**
 * Starts continuous GPS tracking with a persistent Android Foreground Service notification.
 * Keeps running when phone is locked, minimized, or when using other apps.
 */
export async function startBackgroundDispatchUpdates(reportIds: number[] | number): Promise<boolean> {
  const ids = Array.isArray(reportIds) ? reportIds : [reportIds];
  if (ids.length === 0) {
    await stopBackgroundDispatchUpdates();
    return false;
  }

  if (isExpoGo) {
    return false;
  }

  try {
    await AsyncStorage.setItem(ACTIVE_DISPATCH_IDS_KEY, JSON.stringify(ids));

    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') return false;

    try {
      await Location.requestBackgroundPermissionsAsync();
    } catch {
      // Gracefully continue on platforms where background prompt is separate
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_DISPATCH_TASK);
    if (hasStarted) {
      return true;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_DISPATCH_TASK, {
      accuracy: Location.Accuracy.Highest,
      timeInterval: 3000,
      distanceInterval: 2,
      showsBackgroundLocationIndicator: false,
      pausesUpdatesAutomatically: false,
      deferredUpdatesInterval: 3000,
      deferredUpdatesDistance: 2,
    });

    return true;
  } catch (err) {
    console.warn('[startBackgroundDispatchUpdates] Error starting task:', err);
    return false;
  }
}

/**
 * Stops continuous background GPS tracking and removes the foreground notification.
 */
export async function stopBackgroundDispatchUpdates(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVE_DISPATCH_IDS_KEY);
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_DISPATCH_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_DISPATCH_TASK);
    }
  } catch (err) {
    console.warn('[stopBackgroundDispatchUpdates] Error stopping task:', err);
  }
}
