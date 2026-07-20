import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';

export default function RegisterLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="step1-personal" />
      <Stack.Screen name="step2-address" />
      <Stack.Screen name="step3-account" />
    </Stack>
  );
}