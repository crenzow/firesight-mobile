import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Segment {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (key: string) => void;
}

/**
 * iOS-style segmented control (like the Settings app's grouped toggle
 * switches) — a pill-shaped track with a solid highlighted pill behind the
 * active segment. Used for status/severity filters across BFP screens.
 */
export const SegmentedControl: React.FC<SegmentedControlProps> = ({ segments, value, onChange }) => {
  const { colors, radius, typography, isDark } = useTheme();

  return (
    <View
      style={[
        styles.track,
        {
          borderRadius: radius.full,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,28,63,0.06)',
        },
      ]}
    >
      {segments.map((segment) => {
        const isActive = segment.key === value;
        return (
          <Pressable
            key={segment.key}
            onPress={() => onChange(segment.key)}
            style={[
              styles.segment,
              {
                borderRadius: radius.full,
                backgroundColor: isActive ? colors.surface : 'transparent',
              },
              isActive && styles.activeShadow,
            ]}
          >
            <Text
              style={{
                color: isActive ? colors.textPrimary : colors.textMuted,
                fontSize: typography.size.xs,
                fontWeight: isActive ? '700' : '600',
              }}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
  activeShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
});