import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Skeleton } from '../ui/Skeleton';

interface StatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accentColor?: string;
  onPress?: () => void;
  isLoading?: boolean;
}

/**
 * Command Center KPI tile:
 * - When tapped: icon chip pops with a lively spring bounce (scale 1.22 -> 1.0),
 *   card depresses subtly with haptic tap, and border glows with metric tint.
 * - Bold 40px tabular numeral on the left, 40x40 icon chip on the right.
 * - Smooth count-up ticker animation on data load/refresh.
 */
export const StatTile: React.FC<StatTileProps> = ({
  icon,
  value,
  label,
  accentColor,
  onPress,
  isLoading = false,
}) => {
  const { colors, shadow, isDark } = useTheme();
  const tint = accentColor ?? colors.brandOrange;
  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const iconBg = isDark ? `${tint}25` : `${tint}15`;
  const normalBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent';

  // Micro spring-pop animation for icon chip on tap
  const iconScale = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    iconScale.value = withSequence(
      withTiming(1.22, { duration: 110 }),
      withSpring(1, { damping: 9, stiffness: 220, mass: 0.6 })
    );
    onPress?.();
  };

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Smooth count-up ticker animation
  const [displayValue, setDisplayValue] = useState<number | string>(() =>
    typeof value === 'number' ? 0 : value
  );
  const previousValueRef = useRef<number>(0);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    if (isLoading) {
      setDisplayValue(0);
      return;
    }

    const startVal = previousValueRef.current;
    const targetVal = value;
    previousValueRef.current = targetVal;

    let startTimestamp: number | null = null;
    const duration = 420;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startVal + (targetVal - startVal) * easeProgress);
      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, isLoading]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pressableWrapper,
        {
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: normalBorder,
              borderWidth: 1.5,
            },
            !isDark && shadow.card,
          ]}
        >
          <View style={styles.topRow}>
            {isLoading ? (
              <Skeleton width={52} height={40} borderRadius={8} />
            ) : (
              <Text
                style={[
                  styles.value,
                  { color: colors.textPrimary },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {displayValue}
              </Text>
            )}
            <Animated.View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: iconBg,
                },
                animatedIconStyle,
              ]}
            >
              {icon}
            </Animated.View>
          </View>

          <Text
            style={[styles.label, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableWrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  value: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 44,
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
