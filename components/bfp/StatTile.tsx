import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { InteractiveCard } from './InteractiveCard';

interface StatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accentColor?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ icon, value, label, accentColor }) => {
  const { colors, radius, isDark } = useTheme();
  const tint = accentColor ?? colors.brandOrange;
  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';

  return (
    <InteractiveCard style={[styles.shadowOuter, { flex: 1, borderRadius: radius.lg, backgroundColor: cardBg }]}>
      <View
        style={[
          styles.inner,
          {
            borderRadius: radius.lg,
            backgroundColor: cardBg,
            borderColor: isDark ? colors.border : 'rgba(0,0,0,0.055)',
          },
        ]}
      >
        {/* Number and icon on the same row — number dominates, icon is the quiet accent */}
        <View style={styles.topRow}>
          <Text
            style={[styles.value, { color: colors.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          <View style={[styles.iconWrap, { backgroundColor: `${tint}15` }]}>
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
    </InteractiveCard>
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