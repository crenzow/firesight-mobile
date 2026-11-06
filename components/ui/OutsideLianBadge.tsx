import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface OutsideLianBadgeProps {
  size?: 'sm' | 'md';
  variant?: 'short' | 'full';
  style?: ViewStyle;
}

export const OutsideLianBadge: React.FC<OutsideLianBadgeProps> = ({
  size = 'sm',
  variant = 'short',
  style,
}) => {
  const { radius, typography, isDark } = useTheme();

  // Amber / warning palette tuned for dark & light surfaces
  const bg = isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(217, 119, 6, 0.12)';
  const textColor = isDark ? '#FBBF24' : '#B45309';

  const isSm = size === 'sm';
  const label = variant === 'full' ? 'Outside Lian Jurisdiction' : 'Outside Lian';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: radius.full,
          paddingHorizontal: isSm ? 8 : 10,
          paddingVertical: isSm ? 2.5 : 4,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: textColor,
          fontSize: isSm ? 10.5 : typography.size.xs,
          fontWeight: '700',
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
