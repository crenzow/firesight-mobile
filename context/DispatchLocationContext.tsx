import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { incidentService } from '../services/api/incidentService';
import { useAuth } from './AuthContext';
import {
  startBackgroundDispatchUpdates,
  stopBackgroundDispatchUpdates,
} from '../services/location/backgroundDispatchTracker';

export interface GPSCoords {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy?: number | null;
}

interface DispatchLocationContextValue {
  activeDispatchReportId: number | null;
  activeDispatchReportIds: number[];
  isStreaming: boolean;
  currentGPS: GPSCoords | null;
  addDispatchedReportId: (reportId: number) => void;
  removeDispatchedReportId: (reportId: number) => void;
  setActiveDispatchReportId: (reportId: number | null) => void;
  syncDispatchedIncidents: () => Promise<void>;
  stopDispatchTracking: () => void;
}

const DispatchLocationContext = createContext<DispatchLocationContextValue | undefined>(undefined);

export const DispatchLocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeDispatchReportIds, setActiveDispatchReportIds] = useState<number[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentGPS, setCurrentGPS] = useState<GPSCoords | null>(null);

  const activeReportIdsRef = useRef<number[]>([]);
  activeReportIdsRef.current = activeDispatchReportIds;

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastStreamedRef = useRef<number>(0);

  const isBFP = Boolean(
    isAuthenticated && user && (user.role === 'bfp_personnel' || user.role === 'bfp_admin')
  );
  const storageKey = user ? `@firesight_dispatched_ids_${user.user_id}` : '@firesight_dispatched_ids_guest';

  /** Add an incident to the list of dispatched reports receiving GPS streaming */
  const addDispatchedReportId = useCallback((reportId: number) => {
    if (!reportId || isNaN(reportId)) return;
    setActiveDispatchReportIds((prev) => {
      if (prev.includes(reportId)) return prev;
      const updated = [...prev, reportId];
      activeReportIdsRef.current = updated;
      void AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
      void startBackgroundDispatchUpdates(updated);
      return updated;
    });
  }, [storageKey]);

  /** Remove an incident when resolved or closed */
  const removeDispatchedReportId = useCallback((reportId: number) => {
    setActiveDispatchReportIds((prev) => {
      const updated = prev.filter((id) => id !== reportId);
      activeReportIdsRef.current = updated;
      void AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
      if (updated.length === 0) {
        if (locationSubRef.current) {
          locationSubRef.current.remove();
          locationSubRef.current = null;
        }
        setIsStreaming(false);
        setCurrentGPS(null);
        void stopBackgroundDispatchUpdates();
      } else {
        void startBackgroundDispatchUpdates(updated);
      }
      return updated;
    });
  }, [storageKey]);

  /** Convenience / backwards-compatibility helper */
  const setActiveDispatchReportId = useCallback((reportId: number | null) => {
    if (!reportId) {
      setActiveDispatchReportIds([]);
      activeReportIdsRef.current = [];
      void AsyncStorage.removeItem(storageKey).catch(() => {});
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      setIsStreaming(false);
      setCurrentGPS(null);
      void stopBackgroundDispatchUpdates();
    } else {
      addDispatchedReportId(reportId);
    }
  }, [storageKey, addDispatchedReportId]);

  const stopDispatchTracking = useCallback(() => {
    setActiveDispatchReportId(null);
  }, [setActiveDispatchReportId]);

  /** Checks the server for ongoing dispatched incidents matching this responder account */
  const syncDispatchedIncidents = useCallback(async () => {
    if (!isBFP || !user) return;
    try {
      const dispatchedList = await incidentService.list({ status: 'dispatched' });
      if (Array.isArray(dispatchedList)) {
        const currentlyDispatchedMap = new Map(dispatchedList.map((inc) => [inc.report_id, inc]));

        // Read previously remembered dispatched IDs for this officer
        let localIds: number[] = [];
        try {
          const raw = await AsyncStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localIds = parsed;
          }
        } catch {}

        // Incidents that the API marks as dispatched by this specific user
        const serverMyIds = dispatchedList
          .filter((inc) => inc.dispatched_by === user.user_id)
          .map((inc) => inc.report_id);

        // Combine all candidates
        const candidateIds = Array.from(new Set([...localIds, ...serverMyIds, ...activeReportIdsRef.current]));

        // Retain only those that are STILL in dispatched status (drops resolved/closed ones)
        const validActiveIds = candidateIds.filter((id) => currentlyDispatchedMap.has(id));

        // If the officer has active dispatches, keep streaming to all of them
        setActiveDispatchReportIds(validActiveIds);
        activeReportIdsRef.current = validActiveIds;
        await AsyncStorage.setItem(storageKey, JSON.stringify(validActiveIds));

        if (validActiveIds.length === 0) {
          if (locationSubRef.current) {
            locationSubRef.current.remove();
            locationSubRef.current = null;
          }
          setIsStreaming(false);
          setCurrentGPS(null);
          void stopBackgroundDispatchUpdates();
        } else {
          void startBackgroundDispatchUpdates(validActiveIds);
        }
      }
    } catch {
      // Ignore network glitch on polling
    }
  }, [isBFP, user, storageKey]);

  // 1. Initial scan & background check for active dispatches every 15 seconds
  useEffect(() => {
    if (!isBFP) {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      setIsStreaming(false);
      setActiveDispatchReportIds([]);
      activeReportIdsRef.current = [];
      return;
    }

    void syncDispatchedIncidents();
    const interval = setInterval(syncDispatchedIncidents, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [isBFP, syncDispatchedIncidents]);

  // 2. Global GPS Watcher: active whenever activeDispatchReportIds has at least one incident
  useEffect(() => {
    if (!isBFP || activeDispatchReportIds.length === 0) {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      setIsStreaming(false);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setIsStreaming(false);
          return;
        }

        if (isMounted) setIsStreaming(true);

        // Immediate ping from last known position (0ms) to all dispatched incidents
        try {
          const cached = await Location.getLastKnownPositionAsync();
          if (cached && isMounted && activeReportIdsRef.current.length > 0) {
            const coords: GPSCoords = {
              latitude: cached.coords.latitude,
              longitude: cached.coords.longitude,
              heading: cached.coords.heading ?? null,
              speed: cached.coords.speed ?? null,
              accuracy: cached.coords.accuracy ?? null,
            };
            setCurrentGPS(coords);
            lastStreamedRef.current = Date.now();

            const targets = [...activeReportIdsRef.current];
            const payload = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              heading: coords.heading,
              speed: coords.speed,
            };

            void Promise.allSettled(
              targets.map((id) => incidentService.updateLocation(id, payload))
            );
          }
        } catch {
          // Ignore cache miss
        }

        // High accuracy location watcher running across the entire app
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 2000,
            distanceInterval: 2,
          },
          (loc) => {
            if (!isMounted) return;

            const targetIds = activeReportIdsRef.current;
            if (!targetIds || targetIds.length === 0) return;

            const coords: GPSCoords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : null,
              speed: loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed : null,
              accuracy: loc.coords.accuracy ?? null,
            };

            setCurrentGPS((prev) => ({
              ...coords,
              heading: coords.heading ?? prev?.heading ?? null,
            }));

            // Stream throttled every 3 seconds to all currently dispatched incidents
            const now = Date.now();
            if (now - lastStreamedRef.current >= 3000) {
              lastStreamedRef.current = now;
              const payload = {
                latitude: coords.latitude,
                longitude: coords.longitude,
                heading: coords.heading,
                speed: coords.speed,
              };

              void Promise.allSettled(
                targetIds.map((id) =>
                  incidentService.updateLocation(id, payload).catch((err) => {
                    console.warn(`[DispatchLocationProvider] Ping failed for incident ${id}:`, err);
                  })
                )
              );
            }
          }
        );

        locationSubRef.current = sub;
      } catch (err) {
        console.warn('[DispatchLocationProvider] Location tracking error:', err);
        if (isMounted) setIsStreaming(false);
      }
    })();

    return () => {
      isMounted = false;
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, [isBFP, activeDispatchReportIds.length]);

  return (
    <DispatchLocationContext.Provider
      value={{
        activeDispatchReportId: activeDispatchReportIds[0] ?? null,
        activeDispatchReportIds,
        isStreaming,
        currentGPS,
        addDispatchedReportId,
        removeDispatchedReportId,
        setActiveDispatchReportId,
        syncDispatchedIncidents,
        stopDispatchTracking,
      }}
    >
      {children}
    </DispatchLocationContext.Provider>
  );
};

export const useDispatchLocation = (): DispatchLocationContextValue => {
  const ctx = useContext(DispatchLocationContext);
  if (!ctx) {
    throw new Error('useDispatchLocation must be used within a DispatchLocationProvider');
  }
  return ctx;
};
