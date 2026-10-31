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
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * Profile menu card/row matching BFP dashboard card updates:
 * - Standalone cards (isFirst && isLast): elevated surface, 18px radius, shadow.card, and full 1.5px orange border on hold.
 * - Grouped rows (resident multi-item lists): clean internal row press states with dividers.
 */
export const ProfileMenuRow: React.FC<ProfileMenuRowProps> = ({
  icon,
  label,
  subtitle,
  onPress,
  destructive,
  hideChevron,
  gradient,
  isFirst,
  isLast,
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
          paddingVertical: 14,
          paddingHorizontal: spacing.lg,
          borderTopLeftRadius: isFirst ? 18 : 0,
          borderTopRightRadius: isFirst ? 18 : 0,
          borderBottomLeftRadius: isLast ? 18 : 0,
          borderBottomRightRadius: isLast ? 18 : 0,
          backgroundColor: pressed
            ? (isDark ? '#221915' : '#F9FAFB')
            : 'transparent',
          borderColor: pressed
            ? (destructive ? colors.danger : colors.brandOrange)
            : 'transparent',
          borderWidth: 1.5,
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
                  ? (destructive ? colors.danger : colors.brandOrange)
                  : gradient
                  ? 'transparent'
                  : destructive
                  ? `${colors.danger}14`
                  : colors.surfaceElevated,
              },
            ]}
          >
            {gradient && !pressed ? (
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
                color: destructive
                  ? colors.danger
                  : pressed
                  ? colors.brandOrange
                  : colors.textPrimary,
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
    width: 38, 
    height: 38, 
    borderRadius: 12,
    alignItems: 'center', 
    justifyContent: 'center',
    overflow: 'hidden'
  },
});
