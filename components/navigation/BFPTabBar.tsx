import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, FileText, Map as MapIcon, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

const ICONS: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
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

// Explicit whitelist + fixed order for BFP personnel tabs
const VISIBLE_TAB_ORDER = ['dashboard', 'incidents/index', 'map', 'profile/index'] as const;

interface TabItemProps {
  route: { key: string; name: string };
  isFocused: boolean;
  onPress: () => void;
  brandOrange: string;
  tabInactive: string;
}

const TabItem: React.FC<TabItemProps> = ({ route, isFocused, onPress, brandOrange, tabInactive }) => {
  const Icon = ICONS[route.name] ?? Home;
  const label = LABELS[route.name] ?? route.name;

  // Native-driver spring pop animation on selection
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      iconScale.setValue(0.84);
      Animated.spring(iconScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 32,
        bounciness: 8,
      }).start();
    }
  }, [isFocused]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabItem,
        {
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
      accessibilityRole="button"
    >
      {({ pressed }) => {
        const itemColor = isFocused || pressed ? brandOrange : tabInactive;
        return (
          <>
            {/* Top Active Highlight Pill sitting directly flush on the top border */}
            {(isFocused || pressed) && (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: brandOrange, opacity: isFocused ? 1 : 0.6 },
                ]}
              />
            )}

            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <Icon
                size={22}
                color={itemColor}
                strokeWidth={isFocused || pressed ? 2.5 : 1.8}
              />
            </Animated.View>

            <Text
              style={[
                styles.tabLabel,
                {
                  color: itemColor,
                  fontWeight: isFocused || pressed ? '700' : '500',
                },
              ]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
            >
              {label}
            </Text>
          </>
        );
      }}
    </Pressable>
  );
};

export const BFPTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const currentRoute = state.routes[state.index];
  const isVisibleTab = (VISIBLE_TAB_ORDER as readonly string[]).includes(currentRoute?.name);

  // Industry Standard: Hide bottom tab bar on deep detail screens, forms, and utility sub-screens
  if (!isVisibleTab) {
    return null;
  }

  const visibleRoutes = VISIBLE_TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(
    (r): r is (typeof state.routes)[number] => !!r
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingBottom: insets.bottom || 9,
        },
      ]}
    >
      {/* Top hairline border line */}
      <View
        style={[
          styles.topBorder,
          { backgroundColor: colors.border },
        ]}
        pointerEvents="none"
      />

      <View style={styles.row}>
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const onPress = () => {
            try {
              Haptics.selectionAsync();
            } catch {
              // Safe fallback
            }
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              brandOrange={colors.brandOrange}
              tabInactive={colors.tabInactive}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'visible',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    justifyContent: 'space-around',
    overflow: 'visible',
  },
  tabItem: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 2,
    gap: 3,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 44,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    zIndex: 10,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});
