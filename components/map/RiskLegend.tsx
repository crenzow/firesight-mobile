import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const LEGEND_ITEMS = [
  { label: 'High', key: 'High' as const, colorKey: 'riskHigh' as const },
  { label: 'Moderate', key: 'Moderate' as const, colorKey: 'riskModerate' as const },
  { label: 'Mild', key: 'Mild' as const, colorKey: 'riskMild' as const },
];

export const RiskLegend: React.FC = () => {
  const { colors, spacing, radius, typography, shadow } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm },
        shadow.card,
      ]}
    >
      <Text style={[styles.title, { color: colors.textMuted, fontSize: typography.size.xs, marginBottom: 4 }]}>
        RISK LEVEL
      </Text>
      {LEGEND_ITEMS.map((item) => (
        <View key={item.key} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: colors[item.colorKey] }]} />
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginLeft: 6 }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  title: { fontWeight: '700', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});