import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface ProfileMenuRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  hideChevron?: boolean;
}

export const ProfileMenuRow: React.FC<ProfileMenuRowProps> = ({
  icon,
  label,
  subtitle,
  onPress,
  destructive,
  hideChevron,
}) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.row, { paddingVertical: spacing.md }]}>
      <View style={[styles.iconCircle, { backgroundColor: destructive ? `${colors.danger}14` : colors.background }]}>
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
      {hideChevron ? null : <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});