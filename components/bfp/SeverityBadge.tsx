import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

const SEVERITY_LABEL: Record<SeverityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel }> = ({ severity }) => {
  const { colors, spacing, radius, typography } = useTheme();

  const color =
    severity === 'critical' ? colors.danger : severity === 'high' ? colors.brandOrange : severity === 'medium' ? colors.warning : colors.success;

  return (
    <View
      style={[
        styles.badge,
        { borderColor: color, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
      ]}
    >
      <Text style={{ color, fontSize: typography.size.xs, fontWeight: '800' }}>
        {SEVERITY_LABEL[severity].toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { borderWidth: 1.5, alignSelf: 'flex-start' },
});