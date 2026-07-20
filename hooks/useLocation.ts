import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

export interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface UseLocationResult {
  location: CapturedLocation | null;
  isLoading: boolean;
  error: string | null;
  permissionDenied: boolean;
  requestLocation: () => Promise<CapturedLocation | null>;
}

/**
 * Wraps expo-location so screens (Report capture, Home nearest-station
 * context) don't each re-implement permission handling and error states.
 */
export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(async (): Promise<CapturedLocation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setError('Location access is required to attach an accurate location to your report.');
        return null;
      }
      setPermissionDenied(false);

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const result: CapturedLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      setLocation(result);
      return result;
    } catch (err) {
      setError('Unable to detect your current location. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { location, isLoading, error, permissionDenied, requestLocation };
}