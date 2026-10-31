import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { X, Navigation } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { BarangayRiskFeature } from '../../services/api/models';
import { FIRE_STATION } from '../../constants/fireStation';
import { getRoadDistanceKm, calculateHaversineDistanceKm } from '../../services/routing';

interface BarangayDetailCardProps {
  barangay: BarangayRiskFeature;
  onClose: () => void;
  onFocus?: () => void;
}

const TRUE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Bagong Pook': { lat: 14.03197, lng: 120.68155 },
  'Balibago': { lat: 13.9423, lng: 120.64439 },
  'Binubusan': { lat: 13.96961, lng: 120.63589 },
  'Bungahan': { lat: 14.04666, lng: 120.63688 },
  'Cumba': { lat: 13.97202, lng: 120.66282 },
  'Humayingan': { lat: 13.99641, lng: 120.67095 },
  'Kapito': { lat: 14.02038, lng: 120.67075 },
  'Lumaniag': { lat: 13.99354, lng: 120.63384 },
  'Luyahan': { lat: 13.96694, lng: 120.61756 },
  'Malaruhatan': { lat: 14.03692, lng: 120.6656 },
  'Matabungkay': { lat: 13.94521, lng: 120.62596 },
  'Barangay 1 (Poblacion)': { lat: 14.03557, lng: 120.65097 },
  'Barangay 2 (Poblacion)': { lat: 14.0382, lng: 120.65137 },
  'Barangay 3 (Poblacion)': { lat: 14.04056, lng: 120.65076 },
  'Barangay 4 (Poblacion)': { lat: 14.03788, lng: 120.65349 },
  'Barangay 5 (Poblacion)': { lat: 14.04158, lng: 120.6528 },
  'Prenza': { lat: 14.01048, lng: 120.637 },
  'Puting Kahoy': { lat: 13.98976, lng: 120.65286 },
  'San Diego': { lat: 14.03677, lng: 120.63589 },
};

export const BarangayDetailCard: React.FC<BarangayDetailCardProps> = ({
  barangay,
  onClose,
}) => {
  const { colors, spacing, isDark, shadow } = useTheme();

  // Spring entrance & barangay switch micro-animation
  const translateY = useSharedValue(42);
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.8 });
      scale.value = withSpring(1, { damping: 16, stiffness: 220, mass: 0.8 });
    } else {
      scale.value = withSequence(
        withTiming(0.965, { duration: 75 }),
        withSpring(1, { damping: 14, stiffness: 260, mass: 0.7 })
      );
    }
  }, [barangay.barangay_id, opacity, scale, translateY]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const riskColor =
    barangay.risk_level === 'high'
      ? colors.riskHigh
      : barangay.risk_level === 'moderate'
      ? colors.riskModerate
      : colors.riskMild;

  const riskLabel =
    barangay.risk_level === 'high'
      ? 'High Risk'
      : barangay.risk_level === 'moderate'
      ? 'Moderate Risk'
      : 'Mild Risk';

  const centroid = TRUE_CENTROIDS[barangay.barangay_name] || {
    lat: barangay.centroid_lat,
    lng: barangay.centroid_lng,
  };

  // Immediate distance so UI is never blank
  const [distanceKm, setDistanceKm] = useState<number>(() =>
    calculateHaversineDistanceKm(
      centroid.lat,
      centroid.lng,
      FIRE_STATION.latitude,
      FIRE_STATION.longitude
    )
  );

  // Live OSRM calculation hook
  useEffect(() => {
    let isMounted = true;

    getRoadDistanceKm(
      { latitude: FIRE_STATION.latitude, longitude: FIRE_STATION.longitude },
      { latitude: centroid.lat, longitude: centroid.lng }
    ).then((km) => {
      if (isMounted) {
        setDistanceKm(km);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [centroid.lat, centroid.lng]);

  const distanceToStation = distanceKm.toFixed(1);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? 'rgba(21, 26, 48, 0.94)' : '#FFFFFF',
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
          borderRadius: 18,
          paddingHorizontal: spacing.md + 4,
          paddingVertical: spacing.md,
        },
        shadow.card,
        animatedCardStyle,
      ]}
    >
      {/* Top Row: Risk Badge & Close button */}
      <View style={styles.topRow}>
        <View style={[styles.riskBadge, { backgroundColor: `${riskColor}18`, borderColor: riskColor }]}>
          <View style={[styles.dot, { backgroundColor: riskColor }]} />
          <Text style={[styles.riskBadgeText, { color: riskColor }]}>{riskLabel}</Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onClose();
          }}
          hitSlop={10}
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: pressed
                ? colors.brandOrange
                : isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.06)',
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close details"
        >
          {({ pressed }) => (
            <X size={15} color={pressed ? '#FFFFFF' : colors.textSecondary} />
          )}
        </Pressable>
      </View>

      {/* Barangay Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {barangay.barangay_name}
      </Text>

      {/* Distance to Station */}
      <View style={styles.metaItem}>
        <Navigation size={12} color={colors.textMuted} />
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          {distanceToStation} km from Lian Fire Station
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
