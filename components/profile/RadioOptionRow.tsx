import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

interface RadioOptionRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  gradient?: [string, string];
}

export const RadioOptionRow: React.FC<RadioOptionRowProps> = ({ icon, title, subtitle, selected, onPress, gradient }) => {
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
        {gradient ? (
          <View style={styles.iconWrap}>
            <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
            {icon}
          </View>
        ) : (
          icon
        )}
        <View style={{ marginLeft: spacing.sm }}>
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '600' }}>{title}</Text>
          {subtitle ? (
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View style={[styles.radioOuter, { borderColor: selected ? colors.brandOrange : colors.border }]}>
        {selected ? <View style={[styles.radioInner, { backgroundColor: colors.brandOrange }]} /> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 6,
  },
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