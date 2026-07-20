import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface EyeLogoProps {
  size?: number;
}

/**
 * Placeholder "eye" brand mark, built entirely from Views so the app never
 * depends on a missing image asset. Designed to sit inside a circular badge
 * and be swapped for the final logo file later without any layout changes —
 * just replace this component's contents with an <Image> of the same size.
 */
export const EyeLogo: React.FC<EyeLogoProps> = ({ size = 40 }) => {
  const { colors } = useTheme();
  const width = size;
  const height = size * 0.55;

  return (
    <View style={[styles.wrapper, { width, height }]}>
      <View
        style={[
          styles.eyeShape,
          {
            width,
            height,
            borderColor: colors.brandOrange,
          },
        ]}
      />
      <View
        style={[
          styles.pupil,
          {
            width: size * 0.32,
            height: size * 0.32,
            borderRadius: (size * 0.32) / 2,
            backgroundColor: colors.brandOrange,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeShape: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 999,
    transform: [{ scaleY: 1 }],
  },
  pupil: {
    position: 'absolute',
  },
});