import * as Location from 'expo-location';

// Reverse geocode a lat/lng to a human-readable place name using native OS geocoder (Google/Apple)
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (addresses.length > 0) {
      const { name, street, district, city, subregion, region } = addresses[0];
      
      // In the Philippines (Google Maps format):
      // - name is often a landmark or establishment (e.g. "SM Megamall")
      // - street is the road (e.g. "EDSA")
      // - district is often the Barangay (e.g. "Wack-Wack Greenhills")
      // - city or subregion is the City/Municipality (e.g. "Mandaluyong")
      
      const parts = [
        name && name !== street ? name : null,
        street,
        district,
        city || subregion || region
      ].filter(Boolean);
      
      if (parts.length > 0) {
        // Return up to the first 3 most specific parts
        return parts.slice(0, 3).join(', ');
      }
    }
    return 'Unknown area';
  } catch (error) {
    // Silently ignore reverse geocoding errors (e.g., no internet)
    return 'Unknown area';
  }
}
