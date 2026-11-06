import LianGeoJson from '../boundaries/barangay_boundaries_lian.json';
import { LIAN_BARANGAYS, BarangayOption } from '../constants/barangays';

export const BARANGAY_CENTROIDS: Record<number, { lat: number; lng: number }> = {
  1: { lat: 14.03559082, lng: 120.65120156 }, // Barangay 1 (Poblacion)
  2: { lat: 14.03841167, lng: 120.65122254 }, // Barangay 2 (Poblacion)
  3: { lat: 14.04050052, lng: 120.65079293 }, // Barangay 3 (Poblacion)
  4: { lat: 14.03750821, lng: 120.65372699 }, // Barangay 4 (Poblacion)
  5: { lat: 14.04186524, lng: 120.65262232 }, // Barangay 5 (Poblacion)
  6: { lat: 14.03390731, lng: 120.68031512 }, // Bagong Pook
  7: { lat: 13.94182987, lng: 120.64798335 }, // Balibago
  8: { lat: 13.96962055, lng: 120.6379946 },  // Binubusan
  9: { lat: 14.04702781, lng: 120.63716069 }, // Bungahan
  10: { lat: 13.97145406, lng: 120.66043856 }, // Cumba
  11: { lat: 13.99651438, lng: 120.673246 },   // Humayingan
  12: { lat: 14.02081384, lng: 120.66733338 }, // Kapito
  13: { lat: 13.9935465, lng: 120.63359753 },  // Lumaniag
  14: { lat: 13.96693536, lng: 120.61285141 }, // Luyahan
  15: { lat: 14.03733632, lng: 120.66343893 }, // Malaruhatan
  16: { lat: 13.94522103, lng: 120.62497201 }, // Matabungkay
  17: { lat: 14.01048108, lng: 120.63649652 }, // Prenza
  18: { lat: 13.9891084, lng: 120.65326581 },  // Puting Kahoy
  19: { lat: 14.03674678, lng: 120.63040853 }, // San Diego
};

function pointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
  let inside = false;
  const count = polygon.length;
  for (let i = 0, j = count - 1; i < count; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function normalizeName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[-.,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const aliases: Record<string, string> = {
    'barangay 1 pob': 'barangay 1 poblacion',
    'barangay 2 pob': 'barangay 2 poblacion',
    'barangay 3 pob': 'barangay 3 poblacion',
    'barangay 4 pob': 'barangay 4 poblacion',
    'barangay 5 pob': 'barangay 5 poblacion',
    'brgy 1 pob': 'barangay 1 poblacion',
    'brgy 2 pob': 'barangay 2 poblacion',
    'brgy 3 pob': 'barangay 3 poblacion',
    'brgy 4 pob': 'barangay 4 poblacion',
    'brgy 5 pob': 'barangay 5 poblacion',
    'brgy 1': 'barangay 1 poblacion',
    'brgy 2': 'barangay 2 poblacion',
    'brgy 3': 'barangay 3 poblacion',
    'brgy 4': 'barangay 4 poblacion',
    'brgy 5': 'barangay 5 poblacion',
    'pob 1': 'barangay 1 poblacion',
    'pob 2': 'barangay 2 poblacion',
    'pob 3': 'barangay 3 poblacion',
    'pob 4': 'barangay 4 poblacion',
    'pob 5': 'barangay 5 poblacion',
    'poblacion 1': 'barangay 1 poblacion',
    'poblacion 2': 'barangay 2 poblacion',
    'poblacion 3': 'barangay 3 poblacion',
    'poblacion 4': 'barangay 4 poblacion',
    'poblacion 5': 'barangay 5 poblacion',
    'puting kahoy': 'puting kahoy',
  };

  return aliases[normalized] ?? normalized;
}

/**
 * Returns the exact Lian Barangay option (id and name) for a given latitude and longitude.
 * 1. Checks Ray-casting Point-in-Polygon against official Lian GeoJSON boundaries.
 * 2. If point is on the coastline/border within ~800m, matches nearest centroid.
 * 3. Returns null if coordinates are outside Lian borders (e.g. Nasugbu, Calatagan, etc.).
 */
export function findBarangayByCoordinates(lat: number, lng: number): BarangayOption | null {
  const features = (LianGeoJson as any).features || [];
  let matchedName: string | null = null;

  for (const feature of features) {
    const geometry = feature.geometry;
    if (!geometry?.coordinates) continue;

    if (geometry.type === 'Polygon') {
      const ring = geometry.coordinates[0];
      if (ring && pointInPolygon(lat, lng, ring)) {
        matchedName =
          feature.properties?.barangay_name ||
          feature.properties?.BGY_NAME ||
          feature.properties?.name ||
          feature.properties?.adm4_name ||
          null;
        break;
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const poly of geometry.coordinates) {
        const ring = poly[0];
        if (ring && pointInPolygon(lat, lng, ring)) {
          matchedName =
            feature.properties?.barangay_name ||
            feature.properties?.BGY_NAME ||
            feature.properties?.name ||
            feature.properties?.adm4_name ||
            null;
          break;
        }
      }
      if (matchedName) break;
    }
  }

  if (matchedName) {
    const targetNorm = normalizeName(matchedName);
    const found = LIAN_BARANGAYS.find((b) => normalizeName(b.name) === targetNorm);
    if (found) return found;
  }

  // Nearest centroid fallback for immediate shoreline within ~800m (~0.0075 deg)
  const MAX_DEG_DELTA_SQ = 0.0075 * 0.0075;
  let bestId: number | null = null;
  let bestDist = Infinity;
  for (const b of LIAN_BARANGAYS) {
    const centroid = BARANGAY_CENTROIDS[b.id];
    if (centroid) {
      const dLat = centroid.lat - lat;
      const dLng = centroid.lng - lng;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < bestDist) {
        bestDist = dist;
        bestId = b.id;
      }
    }
  }

  if (bestDist <= MAX_DEG_DELTA_SQ && bestId !== null) {
    return LIAN_BARANGAYS.find((b) => b.id === bestId) || null;
  }

  // Point is strictly outside Lian borders
  return null;
}
