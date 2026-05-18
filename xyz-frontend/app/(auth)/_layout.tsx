/**
 * @file app/(auth)/_layout.tsx
 * @description Layout for the authentication flow screens.
 *
 * Uses a Stack navigator with no header — each auth screen manages
 * its own back navigation. Authenticated users who land here are
 * redirected to (tabs) by the root _layout.tsx auth gate.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

/**
 * Auth group stack navigator.
 * All auth screens share this layout — no shared header is shown.
 */
export default function AuthLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
