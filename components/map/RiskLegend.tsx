import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

const LEGEND_ITEMS = [
  { label: 'High', key: 'High' as const, colorKey: 'riskHigh' as const },
  { label: 'Moderate', key: 'Moderate' as const, colorKey: 'riskModerate' as const },
  { label: 'Mild', key: 'Mild' as const, colorKey: 'riskMild' as const },
];

export const RiskLegend: React.FC<{ style?: any; onClose?: () => void }> = ({ style, onClose }) => {
  const { colors, spacing, typography, shadow, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(21, 26, 48, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          borderRadius: 16,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
        shadow.card,
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textMuted, fontSize: typography.size.xs }]}>
          RISK LEVEL
        </Text>
        {onClose && (
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <X size={13} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {LEGEND_ITEMS.map((item) => (
        <View key={item.key} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: colors[item.colorKey] }]} />
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginLeft: 7, fontWeight: '600' }}>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  closeBtn: {
    padding: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
});