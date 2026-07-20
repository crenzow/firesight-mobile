import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onToggle, children, error }) => {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View>
      <Pressable onPress={onToggle} style={styles.row} hitSlop={4}>
        <View
          style={[
            styles.box,
            {
              borderRadius: radius.sm,
              borderColor: error ? colors.danger : checked ? colors.brandOrange : colors.border,
              backgroundColor: checked ? colors.brandOrange : 'transparent',
            },
          ]}
        >
          {checked ? <Check size={14} color={colors.textInverse} /> : null}
        </View>
        <Text style={[styles.text, { color: colors.textSecondary, fontSize: typography.size.sm, marginLeft: spacing.sm }]}>
          {children}
        </Text>
      </Pressable>
      {error ? (
        <Text style={{ color: colors.danger, fontSize: typography.size.xs, marginTop: spacing.xs }}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  text: {
    flex: 1,
    lineHeight: 18,
  },
});