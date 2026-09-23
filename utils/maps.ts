import { Linking, Platform } from 'react-native';

/**
 * Opens the device's native Maps app with directions to the given
 * coordinates. This intentionally defers to Google/Apple Maps for actual
 * turn-by-turn navigation rather than building an in-app router — real
 * route optimization (e.g. the thesis's Dijkstra's-based routing) is a
 * backend/ML concern that will eventually suggest the best station-to-
 * incident path; this button just gets an officer moving immediately using
 * whatever navigation app they already trust.
 */
export async function openDirections(latitude: number, longitude: number, label?: string): Promise<void> {
  const destination = `${latitude},${longitude}`;
  const encodedLabel = encodeURIComponent(label ?? 'Incident Location');

  const url = Platform.select({
    ios: `maps://?daddr=${destination}&q=${encodedLabel}`,
    android: `google.navigation:q=${destination}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
  }) as string;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return;
  }

  // Fallback to the universal web URL if the native maps scheme isn't available.
  await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
}