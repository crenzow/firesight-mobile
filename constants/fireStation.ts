/**
 * BFP Lian Fire Station — fixed origin for route-to-incident navigation.
 *
 * Coordinates are based on Brgy. 1 Poblacion, Lian, Batangas (J.P. Rizal St.),
 * near the municipal hall cluster where the BFP station is situated.
 *
 * ⚠️  Verify and update the latitude/longitude below against the actual
 *     building if GPS precision matters for production navigation.
 */
export const FIRE_STATION = {
  name: 'BFP Lian Fire Station',
  address: 'J.P. Rizal St., Brgy. 1, Lian, Batangas',
  latitude: 14.0355,
  longitude: 120.6508,
} as const;
