import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface RadioOptionRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}

export const RadioOptionRow: React.FC<RadioOptionRowProps> = ({ icon, title, subtitle, selected, onPress }) => {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          borderColor: selected ? colors.brandOrange : colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          backgroundColor: selected ? `${colors.brandOrange}0D` : colors.surface,
        },
      ]}
    >
      <View style={styles.left}>
        {icon}
        <View style={{ marginLeft: spacing.sm }}>
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '600' }}>{title}</Text>
          {subtitle ? (
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View
        style={[
          styles.radioOuter,
          { borderColor: selected ? colors.brandOrange : colors.border },
        ]}
      >
        {selected ? <View style={[styles.radioInner, { backgroundColor: colors.brandOrange }]} /> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
});