import { LogBox } from 'react-native';

// Suppress known Expo Go development notices
LogBox.ignoreLogs([
  'Unable to activate keep awake',
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

const origConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Android Push notifications') || args[0].includes('expo-notifications:'))
  ) {
    // Silently drop Expo Go Android remote push deprecation notice
    return;
  }
  origConsoleError(...args);
};

const origConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('`expo-notifications` functionality is not fully supported in Expo Go')
  ) {
    return;
  }
  origConsoleWarn(...args);
};
