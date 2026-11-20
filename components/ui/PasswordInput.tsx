import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { Input } from './Input';
import { useTheme } from '../../theme/ThemeContext';

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  hideToggleWhenEmpty?: boolean;
}

/**
 * Password field with a show/hide toggle, per the master prompt requirement
 * ("Include a show/hide password toggle") on Login, Register, and Reset flows.
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  required,
  placeholder = 'Enter your password',
  helperText,
  hideToggleWhenEmpty = false,
}) => {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const showToggle = !hideToggleWhenEmpty || (value && value.length > 0);

  return (
    <Input
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={!isVisible}
      autoCapitalize="none"
      autoCorrect={false}
      error={error}
      required={required}
      helperText={helperText}
      leftIcon={<Lock size={18} color={colors.textMuted} />}
      rightElement={
        showToggle ? (
          <Pressable
            onPress={() => setIsVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
          >
            {isVisible ? (
              <EyeOff size={18} color={colors.textMuted} />
            ) : (
              <Eye size={18} color={colors.textMuted} />
            )}
          </Pressable>
        ) : undefined
      }
    />
  );
};