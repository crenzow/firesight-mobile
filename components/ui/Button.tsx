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

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'neutral';

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
    onPress();
  };

  const getBackgroundColor = (pressed: boolean) => {
    switch (variant) {
      case 'primary':
        return pressed ? colors.brandOrangeDeep : colors.brandOrange;
      case 'secondary':
        return pressed ? colors.brandOrange : colors.brandNavy;
      case 'danger':
        return pressed ? '#B93336' : colors.danger;
      case 'success':
        return pressed ? '#168048' : colors.success;
      case 'outline':
        return pressed ? colors.brandOrange : 'transparent';
      case 'neutral':
        return pressed ? (isDark ? '#1E293B' : '#F1F5F9') : colors.surface;
      case 'ghost':
        return pressed ? (isDark ? '#221915' : '#FFF7F2') : 'transparent';
      default:
        return colors.brandOrange;
    }
  };

  const getTextColor = (pressed: boolean) => {
    if (variant === 'neutral') return colors.textPrimary;
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
    if (variant === 'neutral') {
      return {
        borderWidth: 1.5,
        borderColor: colors.border,
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
          opacity: loading ? 0.9 : disabled ? 0.55 : 1,
          transform: [{ scale: pressed && !disabled && !loading ? 0.975 : 1 }],
          ...getBorder(pressed),
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={getTextColor(pressed)}
              style={{ marginRight: spacing.sm }}
            />
          ) : (
            icon && iconPosition === 'left' ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null
          )}
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
          {!loading && icon && iconPosition === 'right' ? (
            <View style={{ marginLeft: spacing.sm }}>{icon}</View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
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