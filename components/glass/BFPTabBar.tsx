import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, FileText, Map as MapIcon, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

const ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  dashboard: Home,
  'incidents/index': FileText,
  map: MapIcon,
  'profile/index': User,
};

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'incidents/index': 'Incidents',
  map: 'Map',
  'profile/index': 'Profile',
};

// Explicit whitelist + fixed order — same fix applied to the resident app's
// CustomTabBar: `options={{ href: null }}` only hides screens from Expo
// Router's *default* tab bar, not a custom one, so every other registered
// screen (incidents/[id], incidents/create, profile/settings,
// notifications) must be filtered out here explicitly.
const VISIBLE_TAB_ORDER = ['dashboard', 'incidents/index', 'map', 'profile/index'] as const;

export const BFPTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const visibleRoutes = VISIBLE_TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(
    (r): r is (typeof state.routes)[number] => !!r
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom || 9,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.row}>
        {visibleRoutes.map((route) => {
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
              <View style={[styles.iconWrap, isFocused && { backgroundColor: `${colors.brandOrange}1A` }]}>
                <Icon size={22} color={color} />
              </View>
              <Text style={[styles.label, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconWrap: { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600' },
});