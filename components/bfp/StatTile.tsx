import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { InteractiveCard } from './InteractiveCard';

interface StatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accentColor?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ icon, value, label, accentColor }) => {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const tint = accentColor ?? colors.brandOrange;

  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';

  return (
    <InteractiveCard style={[styles.shadowOuter, { flex: 1, borderRadius: radius.lg, backgroundColor: cardBg }]}>
      <View
        style={{
          flex: 1,
          borderRadius: radius.lg,
          backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(0,0,0,0.055)',
          overflow: 'hidden',
          padding: spacing.md,
        }}
      >
        <LinearGradient
          colors={[`${tint}33`, `${tint}05`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconWrap, { borderColor: `${tint}33`, borderRadius: 12 }]}
        >
          {icon}
        </LinearGradient>
        <View style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.xxl, fontWeight: '900' }}>
            {value}
          </Text>
          <Text
            style={{
              color: isDark ? 'rgba(255,255,255,0.75)' : colors.textSecondary,
              fontSize: typography.size.xs,
              marginTop: 2,
              fontWeight: '700',
            }}
          >
            {label}
          </Text>
        </View>
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
      android: {
        elevation: 3,
      },
    }),
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});