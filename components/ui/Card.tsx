import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  variant?: 'default' | 'warm';
  intensity?: number;
}

/**
 * Universal Card component used across both Resident and BFP interfaces.
 *
 * Design System Recipe:
 * - Corner Radius: 18px squircle.
 * - Light Mode: Pure-white surface + soft ambient drop shadow (shadow.card), borderless.
 * - Dark Mode: Elevated dark surface + subtle translucent hairline border.
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding,
}) => {
  const { colors, shadow, spacing, isDark } = useTheme();
  const resolvedPadding = padding ?? spacing.lg;
  const borderRadius = 18;

  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent';

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const {
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    flex,
    width,
    height,
    alignSelf,
    zIndex,
    ...innerStyles
  } = flattenedStyle;

  const outerLayoutStyle: ViewStyle = {
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    flex,
    width,
    height,
    alignSelf,
    zIndex,
    borderRadius,
    backgroundColor: cardBg,
    ...(!isDark ? shadow.card : {}),
  };

  return (
    <View style={outerLayoutStyle}>
      <View
        style={[
          {
            borderRadius,
            backgroundColor: cardBg,
            borderWidth: isDark ? 1 : 0,
            borderColor: cardBorderColor,
            overflow: 'hidden',
            padding: resolvedPadding,
          },
          innerStyles,
        ]}
      >
        {children}
      </View>
    </View>
  );
};
