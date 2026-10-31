import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

interface DashboardHeroProps {
  firstName?: string | null;
}

/**
 * Compact navy gradient canopy header:
 * - Line 1: Subdued uppercase station tag & date (e.g. LIAN BFP · FRI, OCT 31).
 * - Line 2: Bold personalized greeting.
 * - Reduced bottom padding so the 2x2 stat cards tuck cleanly and sit higher above the fold.
 */
export const DashboardHero: React.FC<DashboardHeroProps> = ({ firstName }) => {
  const { colors } = useTheme();
  const now = new Date();

  const dateLabel = now
    .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    .toUpperCase();

  return (
    <LinearGradient colors={[colors.brandNavy, colors.brandNavyDeep]} style={styles.hero}>
      {/* Overscroll Bleed: moves WITH the scroll so hard/sudden downward scrolls always show navy */}
      <View
        style={[styles.overscrollBleed, { backgroundColor: colors.brandNavy }]}
        pointerEvents="none"
      />
      <Text style={styles.date}>{dateLabel}</Text>
      <Text style={styles.greeting}>
        Good {getTimeOfDayLabel(now)}, {firstName ?? 'Officer'}
      </Text>
    </LinearGradient>
  );
};

function getTimeOfDayLabel(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) {
    return 'morning';
  }
  if (hour < 18) {
    return 'afternoon';
  }
  return 'evening';
}

const styles = StyleSheet.create({
  overscrollBleed: {
    position: 'absolute',
    top: -800,
    left: 0,
    right: 0,
    height: 800,
  },
  hero: {
    marginTop: -1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 46,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  date: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 4,
  },
});
