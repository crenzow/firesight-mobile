import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  fullWidth?: boolean;
}

/**
 * Single source of truth for button styling across the app.
 * Using this everywhere means theme changes (light / black dark / dim dark)
 * apply consistently without touching individual screens.
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'right',
  style,
  fullWidth = true,
}) => {
  const { colors, radius, spacing, typography, isDark } = useTheme();

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Safe fallback
    }
    onPress();
  };

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.disabled;
    switch (variant) {
      case 'primary':
        return pressed ? colors.brandOrangeDeep : colors.brandOrange;
      case 'secondary':
        return pressed ? colors.brandOrange : colors.brandNavy;
      case 'danger':
        return pressed ? '#B93336' : colors.danger;
      case 'outline':
        return pressed ? colors.brandOrange : 'transparent';
      case 'ghost':
        return pressed ? (isDark ? '#221915' : '#FFF7F2') : 'transparent';
      default:
        return colors.brandOrange;
    }
  };

  const getTextColor = (pressed: boolean) => {
    if (disabled) return colors.textMuted;
    if (variant === 'outline') return pressed ? '#FFFFFF' : colors.brandOrange;
    if (variant === 'ghost') return pressed ? colors.brandOrange : colors.textPrimary;
    return colors.textInverse;
  };

  const getBorder = (pressed: boolean) => {
    if (variant === 'outline') {
      return {
        borderWidth: 1.5,
        borderColor: colors.brandOrange,
      };
    }
    return {};
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBackgroundColor(pressed),
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          width: fullWidth ? '100%' : undefined,
          transform: [{ scale: pressed && !disabled && !loading ? 0.975 : 1 }],
          ...getBorder(pressed),
        },
        style,
      ]}
    >
      {({ pressed }) => (
        loading ? (
          <ActivityIndicator color={getTextColor(pressed)} />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[
                styles.label,
                { color: getTextColor(pressed), fontSize: typography.size.sm + 1, fontWeight: typography.weight.semibold },
              ]}
            >
              {label}
            </Text>
            {icon && iconPosition === 'right' ? <View style={{ marginLeft: spacing.sm }}>{icon}</View> : null}
          </View>
        )
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});