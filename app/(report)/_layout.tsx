import React from 'react';
import { Stack } from 'expo-router';
import { ReportDraftProvider } from '../../context/ReportDraftContext';

export default function ReportLayout() {
  return (
    <ReportDraftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="capture" />
        <Stack.Screen name="review" />
        <Stack.Screen name="success" />
      </Stack>
    </ReportDraftProvider>
  );
}