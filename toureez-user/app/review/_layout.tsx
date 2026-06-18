/**
 * @file app/review/_layout.tsx
 * @description Stack layout for the review flow.
 * Headers are hidden — each screen renders its own custom header.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function ReviewLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="[bookingId]" />
      <Stack.Screen
        name="success"
        options={{
          // Prevent going back to the write screen after submission
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
