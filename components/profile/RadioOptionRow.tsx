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
  const { colors, spacing, typography, shadow, isDark } = useTheme();

  const isHighlighted = selected;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: pressed || isHighlighted
            ? colors.brandOrange
            : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent'),
          borderRadius: 18,
          padding: 14,
          marginBottom: spacing.sm,
          backgroundColor: pressed
            ? (isDark ? '#221915' : '#F9FAFB')
            : (isHighlighted
            ? (isDark ? '#1C1613' : '#FFFFFF')
            : (isDark ? colors.surfaceElevated : '#FFFFFF')),
          borderWidth: 1.5,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        !isDark && shadow.card,
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
              <Text style={{ color: pressed || isHighlighted ? colors.brandOrange : colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700' }}>{title}</Text>
              {subtitle ? (
                <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>{subtitle}</Text>
              ) : null}
            </View>
          </View>
          <View style={[styles.radioOuter, { borderColor: pressed || isHighlighted ? colors.brandOrange : (isDark ? 'rgba(255, 255, 255, 0.2)' : colors.border) }]}>
            {isHighlighted || pressed ? (
              <View
                style={[
                  styles.radioInner,
                  {
                    backgroundColor: colors.brandOrange,
                    opacity: pressed && !isHighlighted ? 0.4 : 1,
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 38,
    height: 38,
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
