import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface ProfileMenuRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  hideChevron?: boolean;
  gradient?: [string, string]; // e.g. ['#6D5BD0', '#3B4CCA']
}

export const ProfileMenuRow: React.FC<ProfileMenuRowProps> = ({
  icon,
  label,
  subtitle,
  onPress,
  destructive,
  hideChevron,
  gradient,
}) => {
  const { colors, spacing, typography, isDark } = useTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
          marginHorizontal: -spacing.sm,
          borderRadius: 12,
          backgroundColor: pressed
            ? (isDark ? '#221915' : '#FFF7F2')
            : 'transparent',
          borderColor: pressed ? colors.brandOrange : 'transparent',
          borderWidth: 1.5,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {({ pressed }) => (
        <>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: pressed
                  ? colors.brandOrange
                  : destructive
                  ? `${colors.danger}14`
                  : (gradient ? 'transparent' : colors.surfaceElevated),
              },
            ]}
          >
            {gradient && !destructive && !pressed ? (
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}
            {icon}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text
              style={{
                color: destructive ? colors.danger : colors.textPrimary,
                fontSize: typography.size.sm,
                fontWeight: '600',
              }}
            >
              {label}
            </Text>
            {subtitle ? (
              <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>{subtitle}</Text>
            ) : null}
          </View>
          {hideChevron ? null : (
            <ChevronRight
              size={18}
              color={pressed ? colors.brandOrange : colors.textMuted}
            />
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, // Square-rounded for premium look
    alignItems: 'center', 
    justifyContent: 'center',
    overflow: 'hidden'
  },
});