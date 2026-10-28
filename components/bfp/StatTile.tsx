import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  const iconBg = isDark ? `${tint}25` : `${tint}15`;

  // Static display mode when no onPress action is assigned
  if (!onPress) {
    return (
      <View
        style={[
          styles.inner,
          {
            borderRadius: radius.lg,
            backgroundColor: cardBg,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text
            style={[styles.value, { color: colors.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            {icon}
          </View>
        </View>

        <Text
          style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.45)' : colors.textSecondary }]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        {
          flex: 1,
          borderRadius: radius.lg,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.inner,
            {
              borderRadius: radius.lg,
              backgroundColor: pressed ? (isDark ? '#221915' : '#F9FAFB') : cardBg,
              borderColor: pressed ? tint : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB'),
              borderWidth: pressed ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.topRow}>
            <Text
              style={[styles.value, { color: pressed ? tint : colors.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {value}
            </Text>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: pressed
                    ? colors.brandOrange
                    : iconBg,
                },
              ]}
            >
              {icon}
            </View>
          </View>

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