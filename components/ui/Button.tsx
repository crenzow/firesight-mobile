import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
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
  const { colors, radius, spacing, typography } = useTheme();

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.disabled;
    switch (variant) {
      case 'primary':
        return pressed ? colors.brandOrangeDeep : colors.brandOrange;
      case 'secondary':
        return pressed ? colors.brandNavyDeep : colors.brandNavy;
      case 'danger':
        return pressed ? '#B93336' : colors.danger;
      case 'outline':
      case 'ghost':
        return pressed ? colors.surfaceElevated : 'transparent';
      default:
        return colors.brandOrange;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (variant === 'outline') return colors.brandOrange;
    if (variant === 'ghost') return colors.textPrimary;
    return colors.textInverse;
  };

  const getBorder = () => {
    if (variant === 'outline') return { borderWidth: 1.5, borderColor: colors.brandOrange };
    return {};
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBackgroundColor(pressed),
          paddingVertical: spacing.md + 2,
          borderRadius: radius.md,
          width: fullWidth ? '100%' : undefined,
          ...getBorder(),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null}
          <Text
            style={[
              styles.label,
              { color: getTextColor(), fontSize: typography.size.md, fontWeight: typography.weight.semibold },
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' ? <View style={{ marginLeft: spacing.sm }}>{icon}</View> : null}
        </View>
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