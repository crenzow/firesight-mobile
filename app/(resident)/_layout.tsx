import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CustomTabBar } from '../../components/navigation/CustomTabBar';

export default function ResidentLayout() {
  const { colors } = useTheme();
  const { isAuthenticated, isBootstrapping } = useAuth();

  // Guard the entire resident area: bounce unauthenticated users back to
  // the welcome screen instead of letting them deep-link into the app.
  if (!isBootstrapping && !isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="learn/index" options={{ title: 'Learn' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />

      {/* Screens reachable via navigation but intentionally not shown as tabs */}
      <Tabs.Screen name="learn/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="profile/settings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="announcements" options={{ href: null }} />
      <Tabs.Screen name="emergency-contacts" options={{ href: null }} />
      <Tabs.Screen name="reports/index" options={{ href: null }} />
      <Tabs.Screen name="reports/[id]" options={{ href: null }} />
    </Tabs>
  );
}