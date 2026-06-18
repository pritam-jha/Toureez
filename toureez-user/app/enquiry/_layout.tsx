/**
 * @file app/enquiry/_layout.tsx
 * @description Stack layout for the traveler enquiry flow.
 * Headers are hidden — each screen renders its own custom header.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function EnquiryLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
