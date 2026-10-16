import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Layers, Filter, LocateFixed, Info } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface MapFloatingControlsProps {
  onOpenMapType: () => void;
  onLocateUser?: () => void;
  isLocating?: boolean;
  onOpenFilter?: () => void;
  isFilterActive?: boolean;
  onToggleLegend?: () => void;
  isLegendVisible?: boolean;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  onOpenMapType,
  onLocateUser,
  isLocating = false,
  onOpenFilter,
  isFilterActive = false,
  onToggleLegend,
  isLegendVisible = true,
}) => {
  const { colors, shadow, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(21, 26, 48, 0.92)' : 'rgba(255, 255, 255, 0.94)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
        shadow.card,
      ]}
    >
      {/* Map Type / Layers Button */}
      <Pressable
        onPress={onOpenMapType}
        hitSlop={4}
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Map type selector"
      >
        <Layers size={19} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>

      {/* Recenter / Locate Me Button */}
      {onLocateUser && (
        <>
          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
          <Pressable
            onPress={onLocateUser}
            hitSlop={4}
            disabled={isLocating}
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Locate my position"
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.brandOrange} />
            ) : (
              <LocateFixed size={19} color={colors.brandOrange} strokeWidth={2} />
            )}
          </Pressable>
        </>
      )}

      {/* Filter Button (if provided) */}
      {onOpenFilter && (
        <>
          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
          <Pressable
            onPress={onOpenFilter}
            hitSlop={4}
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.7 : 1 },
              isFilterActive && { backgroundColor: `${colors.brandOrange}18` },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Filter risk levels"
          >
            <Filter
              size={18}
              color={isFilterActive ? colors.brandOrange : colors.textPrimary}
              strokeWidth={2}
            />
            {isFilterActive && (
              <View style={[styles.activeDot, { backgroundColor: colors.brandOrange, borderColor: colors.surface }]} />
            )}
          </Pressable>
        </>
      )}

      {/* Toggle Legend */}
      {onToggleLegend && (
        <>
          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
          <Pressable
            onPress={onToggleLegend}
            hitSlop={4}
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.7 : 1 },
              isLegendVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Toggle risk legend"
          >
            <Info
              size={19}
              color={colors.textPrimary}
              strokeWidth={2}
            />
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    width: 44,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  divider: {
    width: 28,
    height: 1,
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
