import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Prevent the native splash screen from hiding until auth is determined
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Clean entrance router.
 * Keeps the native Android splash screen visible while checking SecureStore
 * for a saved login, then immediately transitions into Welcome or Home.
 */
export default function IndexScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/welcome');
    } else if (user?.role === 'bfp_personnel') {
      router.replace('/(bfp)/dashboard');
    } else {
      router.replace('/(resident)/home');
    }

    // Hide native splash cleanly once destination is resolved
    SplashScreen.hideAsync().catch(() => {});
  }, [isBootstrapping, isAuthenticated, user]);

  return <View style={{ flex: 1, backgroundColor: colors.brandNavy }} />;
}
