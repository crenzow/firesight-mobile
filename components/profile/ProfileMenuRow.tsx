import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { colors, spacing, typography } = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.row, { paddingVertical: spacing.md }]}>
      <View style={[styles.iconWrap, { backgroundColor: destructive ? `${colors.danger}14` : (gradient ? 'transparent' : colors.surfaceElevated) }]}>
        {gradient && !destructive ? (
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
      {hideChevron ? null : <ChevronRight size={18} color={colors.textMuted} />}
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