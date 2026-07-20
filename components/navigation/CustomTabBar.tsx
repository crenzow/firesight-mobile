import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Map as MapIcon, BookOpen, User, Flame } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

const ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  home: Home,
  map: MapIcon,
  'learn/index': BookOpen,
  'profile/index': User,
};

const LABELS: Record<string, string> = {
  home: 'Home',
  map: 'Map',
  'learn/index': 'Learn',
  'profile/index': 'Profile',
};

// The ONLY route names that should ever appear as tabs. Every other screen
// registered under (resident)/_layout.tsx (reports/[id], profile/edit,
// profile/settings, notifications, announcements, emergency-contacts,
// learn/[id]) is reachable via router.push() but must never render here —
// `options={{ href: null }}` only hides them from Expo Router's *default*
// tab bar, not from a custom one like this, so we filter explicitly instead.
const VISIBLE_TAB_ORDER = ['home', 'map', 'learn/index', 'profile/index'] as const;

/**
 * Custom tab bar matching the Figma reference: four real tab destinations
 * (Home, Map, Learn, Profile) plus a centered, elevated orange Report FAB
 * that isn't a tab route at all — tapping it pushes into the standalone
 * (report) capture -> review -> success stack.
 */
export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();

  // Only keep the 4 routes we actually want as tabs, in a fixed order —
  // regardless of how many other screens are registered in this navigator.
  const visibleRoutes = VISIBLE_TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(
    (r): r is (typeof state.routes)[number] => !!r
  );
  const leftRoutes = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2);

  const renderTab = (route: (typeof visibleRoutes)[number]) => {
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const isFocused = state.index === routeIndex;
    const Icon = ICONS[route.name] ?? Home;
    const label = LABELS[route.name] ?? route.name;
    const color = isFocused ? colors.brandOrange : colors.tabInactive;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable key={route.key} onPress={onPress} style={styles.tabItem} accessibilityRole="button">
        <Icon size={22} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom || 8 },
      ]}
    >
      <View style={styles.row}>
        {leftRoutes.map((route) => renderTab(route))}

        <View style={styles.fabSlot}>
          <Pressable
            onPress={() => router.push('/(report)/capture')}
            style={[styles.fab, { backgroundColor: colors.brandOrange }, shadow.fab]}
            accessibilityRole="button"
            accessibilityLabel="Report a fire"
          >
            <Flame size={26} color="#FFFFFF" />
          </Pressable>
        </View>

        {rightRoutes.map((route) => renderTab(route))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  fabSlot: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});