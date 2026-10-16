/**
 * OSRM (Open Source Routing Machine) routing client.
 * Calls the live OSRM routing engine to fetch driving road distance and route geometry.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

// In-memory cache to prevent repeated network requests for identical origin-destination pairs
const routeDistanceCache = new Map<string, number>();

/**
 * Calculates straight-line spherical distance (km) using the Haversine formula as fallback.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetches real drivable road distance (in kilometers) from the live OSRM API.
 * Falls back to Haversine straight-line distance if offline or OSRM times out.
 */
export async function getRoadDistanceKm(
  origin: LatLng,
  destination: LatLng
): Promise<number> {
  const cacheKey = `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}->${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;

  if (routeDistanceCache.has(cacheKey)) {
    return routeDistanceCache.get(cacheKey)!;
  }

  try {
    // OSRM expects coordinates in [longitude, latitude] format
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const roadKm = data.routes[0].distance / 1000;
        routeDistanceCache.set(cacheKey, roadKm);
        return roadKm;
      }
    }
  } catch (error) {
    // Silently fall back on network error, offline mode, or timeout
  }

  // Fallback to Haversine straight-line distance
  const fallbackKm = calculateHaversineDistanceKm(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );
  return fallbackKm;
}
