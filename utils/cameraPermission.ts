import { Camera } from 'expo-camera';
import { Alert, Linking } from 'react-native';

/**
 * Checks and requests camera access right where the user currently is.
 * Returns true if granted, or false if denied.
 */
export async function ensureCameraAccess(): Promise<boolean> {
  try {
    const current = await Camera.getCameraPermissionsAsync();
    if (current.granted) {
      return true;
    }

    if (current.canAskAgain) {
      const result = await Camera.requestCameraPermissionsAsync();
      return result.granted;
    }

    Alert.alert(
      'Camera Permission Required',
      'Camera access is disabled in your device settings. Please enable it to capture fire report photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  } catch (error) {
    console.warn('[CameraPermission] Error requesting camera access:', error);
    return false;
  }
}
