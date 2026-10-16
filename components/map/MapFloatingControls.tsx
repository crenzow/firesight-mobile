import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Layers, Filter } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface MapFloatingControlsProps {
  onOpenMapType: () => void;
  onOpenFilter: () => void;
  isFilterActive?: boolean;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  onOpenMapType,
  onOpenFilter,
  isFilterActive = false,
}) => {
  const { colors, shadow } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, shadow.card]}>
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
        <Layers size={20} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Risk Filter Button */}
      <Pressable
        onPress={onOpenFilter}
        hitSlop={4}
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.7 : 1 },
          isFilterActive && { backgroundColor: `${colors.brandOrange}14` },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Filter risk levels"
      >
        <Filter
          size={19}
          color={isFilterActive ? colors.brandOrange : colors.textPrimary}
          strokeWidth={2}
        />
        {isFilterActive && (
          <View style={[styles.activeDot, { backgroundColor: colors.brandOrange, borderColor: colors.surface }]} />
        )}
      </Pressable>
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
