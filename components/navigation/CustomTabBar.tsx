import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Map as MapIcon, BookOpen, User, Flame } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

const ICONS: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
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

// The ONLY route names that should ever appear as tabs.
const VISIBLE_TAB_ORDER = ['home', 'map', 'learn/index', 'profile/index'] as const;

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
  const color = isFocused ? brandOrange : tabInactive;

  // Android Native-Driver spring pop on selection
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
            {/* Top Active Highlight Pill sitting directly flush on top border line */}
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

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const visibleRoutes = VISIBLE_TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(
    (r): r is (typeof state.routes)[number] => !!r
  );
  const leftRoutes = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2);

  // Android Native-Driver spring scale for tactile FAB press
  const fabScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(fabScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 45,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(fabScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 9,
    }).start();
  };

  const handleReportPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Safe fallback
    }
    router.push('/(report)/capture');
  };

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
      {/* Top hairline borders that stop cleanly before the center FAB cutout */}
      <View
        style={[
          styles.borderSegmentLeft,
          { backgroundColor: colors.border },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.borderSegmentRight,
          { backgroundColor: colors.border },
        ]}
        pointerEvents="none"
      />

      <View style={styles.row}>
        {leftRoutes.map((route) => {
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

        {/* Center Report Floating Action Button */}
        <View style={styles.fabSlot}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleReportPress}
            style={styles.fabPressable}
            accessibilityRole="button"
            accessibilityLabel="Report a fire"
          >
            {({ pressed }) => (
              <>
                <Animated.View
                  style={[
                    styles.fab,
                    {
                      backgroundColor: pressed ? colors.brandOrangeDeep : colors.brandOrange,
                      borderColor: colors.surface,
                      transform: [{ scale: fabScale }],
                    },
                  ]}
                >
                  <Flame size={27} color="#FFFFFF" strokeWidth={2.4} />
                </Animated.View>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: pressed ? colors.brandOrange : colors.tabInactive,
                      fontWeight: pressed ? '700' : '500',
                      marginTop: 3,
                      textAlign: 'center',
                      width: '100%',
                    },
                  ]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                >
                  Report
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {rightRoutes.map((route) => {
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
  },
  borderSegmentLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: '50%',
    marginRight: 42,
    height: StyleSheet.hairlineWidth,
    zIndex: 1,
  },
  borderSegmentRight: {
    position: 'absolute',
    top: 0,
    left: '50%',
    right: 0,
    marginLeft: 42,
    height: StyleSheet.hairlineWidth,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    justifyContent: 'space-around',
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
  fabSlot: {
    width: 74,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  fabPressable: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -34,
    borderWidth: 5,
    zIndex: 50,
  },
});