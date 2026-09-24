import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const LEGEND_ITEMS = [
  { label: 'Critical', key: 'critical' as const },
  { label: 'High', key: 'high' as const },
  { label: 'Medium', key: 'moderate' as const },
  { label: 'Low', key: 'low' as const },
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
          <View style={[styles.dot, { backgroundColor: colors[`risk${capitalize(item.key)}` as 'riskHigh'] }]} />
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginLeft: 6 }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

function capitalize(value: string): string {
  if (value === 'moderate') return 'Moderate';
  if (value === 'critical') return 'Critical';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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