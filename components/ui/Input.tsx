import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required,
  leftIcon,
  rightElement,
  helperText,
  style,
  ...textInputProps
}) => {
  const { colors, radius, spacing, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? colors.danger : isFocused ? colors.brandOrange : colors.border;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={[
          styles.label,
          { color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.xs },
        ]}
      >
        {label}
        {required ? <Text style={{ color: colors.brandOrange }}> *</Text> : null}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {leftIcon ? <View style={{ marginRight: spacing.sm }}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { color: colors.textPrimary, fontSize: typography.size.base, paddingVertical: spacing.md },
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          {...textInputProps}
        />
        {rightElement ? <View style={{ marginLeft: spacing.sm }}>{rightElement}</View> : null}
      </View>

      {error ? (
        <Text style={[styles.helper, { color: colors.danger, fontSize: typography.size.xs, marginTop: spacing.xs }]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[styles.helper, { color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xs }]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
  },
  helper: {},
});