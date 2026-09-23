import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BFPTabBar } from '../../components/glass/BFPTabBar';

export default function BFPLayout() {
  const { colors } = useTheme();
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  // Redirect unauthenticated users to the login screen.
  if (!isBootstrapping && !isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Residents should never land in the BFP interface, even by deep link.
  if (!isBootstrapping && user && user.role === 'resident') {
    return <Redirect href="/(resident)/home" />;
  }

  return (
    <Tabs
      tabBar={(props) => <BFPTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="incidents/index" options={{ title: 'Incidents' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />

      {/* Reachable via navigation, hidden from the custom tab bar */}
      <Tabs.Screen name="incidents/[id]" options={{ href: null }} />
      <Tabs.Screen name="incidents/create" options={{ href: null }} />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="profile/settings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}