import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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
  const { colors, spacing, typography, radius, isDark } = useTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: pressed || selected ? colors.brandOrange : colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          backgroundColor: pressed
            ? (isDark ? '#221915' : '#F9FAFB')
            : (selected ? (isDark ? '#1C1613' : '#FFFFFF') : (isDark ? colors.surfaceElevated : '#FFFFFF')),
          borderWidth: pressed || selected ? 1.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {({ pressed }) => (
        <>
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
              <Text style={{ color: pressed ? colors.brandOrange : colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700' }}>{title}</Text>
              {subtitle ? (
                <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>{subtitle}</Text>
              ) : null}
            </View>
          </View>
          <View style={[styles.radioOuter, { borderColor: pressed || selected ? colors.brandOrange : colors.border }]}>
            {selected || pressed ? (
              <View
                style={[
                  styles.radioInner,
                  {
                    backgroundColor: colors.brandOrange,
                    opacity: pressed && !selected ? 0.4 : 1,
                  },
                ]}
              />
            ) : null}
          </View>
        </>
      )}
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