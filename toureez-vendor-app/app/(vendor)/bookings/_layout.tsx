/**
 * @file app/(vendor)/bookings/_layout.tsx
 * @description Stack navigator for the Bookings tab.
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function BookingsLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
