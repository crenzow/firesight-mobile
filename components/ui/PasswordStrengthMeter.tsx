import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { passwordStrength } from '../../utils/validators';

interface PasswordStrengthMeterProps {
  password: string;
}

const STRENGTH_CONFIG = {
  weak: { label: 'Weak', segments: 1 },
  fair: { label: 'Fair', segments: 2 },
  strong: { label: 'Strong', segments: 3 },
} as const;

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const { colors, spacing, typography, radius } = useTheme();

  if (!password) return null;

  const strength = passwordStrength(password);
  const { label, segments } = STRENGTH_CONFIG[strength];
  const color = strength === 'weak' ? colors.danger : strength === 'fair' ? colors.warning : colors.success;

  return (
    <View style={{ marginTop: -spacing.md, marginBottom: spacing.lg }}>
      <View style={styles.barsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor: i < segments ? color : colors.border,
                borderRadius: radius.sm,
              },
            ]}
          />
        ))}
      </View>
      <Text style={{ color, fontSize: typography.size.xs, marginTop: spacing.xs, fontWeight: '600' }}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  barsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bar: {
    flex: 1,
    height: 4,
  },
});