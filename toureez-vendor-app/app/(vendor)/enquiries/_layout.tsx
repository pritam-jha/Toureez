/**
 * @file app/(vendor)/enquiries/_layout.tsx
 * @description Stack navigator for the vendor enquiry inbox.
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function EnquiriesLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
