import React from 'react';
import { View, Text, Platform, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface StatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accentColor?: string;
  onPress?: () => void;
}

export const StatTile: React.FC<StatTileProps> = ({ icon, value, label, accentColor, onPress }) => {
  const { colors, radius, isDark } = useTheme();
  const tint = accentColor ?? colors.brandOrange;
  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.shadowOuter,
        {
          flex: 1,
          borderRadius: radius.lg,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.inner,
            {
              borderRadius: radius.lg,
              backgroundColor: pressed ? (isDark ? '#221915' : '#FFF7F2') : cardBg,
              borderColor: pressed ? tint : (isDark ? colors.border : 'rgba(0,0,0,0.055)'),
              borderWidth: pressed ? 1.5 : 1,
            },
          ]}
        >
          {/* Number and icon on the same row — number dominates, icon is the quiet accent */}
          <View style={styles.topRow}>
            <Text
              style={[styles.value, { color: pressed ? tint : colors.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {value}
            </Text>
            <View style={[styles.iconWrap, { backgroundColor: pressed ? `${tint}25` : `${tint}15` }]}>
              {icon}
            </View>
          </View>

          {/* Label — small, muted, below */}
          <Text
            style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.45)' : colors.textSecondary }]}
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
  shadowOuter: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A2340',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  inner: {
    flex: 1,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  value: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 40,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  label: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});