/**
 * @file app/(vendor)/packages/_layout.tsx
 * @description Stack navigator for the Packages tab.
 *
 * All package screens (list, new, detail, pricing, itinerary, images) are
 * rendered within this stack so back-navigation works correctly within the tab.
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function PackagesLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/pricing" />
      <Stack.Screen name="[id]/itinerary" />
      <Stack.Screen name="[id]/images" />
    </Stack>
  );
}
