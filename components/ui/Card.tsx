import React from 'react';
import { View, ViewStyle, Platform, StyleSheet, StyleProp } from 'react-native';
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
 * Enforces a consistent 16px (radius.lg) corner radius for all cards.
 *
 * Light mode : pure-white surface + soft rounded drop shadow.
 * Dark mode  : elevated surface color + subtle dark border.
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding,
}) => {
  const { colors, radius, spacing, isDark } = useTheme();
  const resolvedPadding = padding ?? spacing.lg;
  const borderRadius = radius.lg; // Fixed 16px corner radius across all cards

  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const cardBorderColor = isDark ? colors.border : 'rgba(0,0,0,0.055)';

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
  };

  return (
    <View
      style={[
        outerLayoutStyle,
        isDark ? undefined : styles.shadowOuter,
      ]}
    >
      <View
        style={[
          {
            borderRadius,
            backgroundColor: cardBg,
            borderWidth: 1,
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

const styles = StyleSheet.create({
  shadowOuter: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A2340',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
        backgroundColor: '#FFFFFF',
      },
    }),
  },
});
