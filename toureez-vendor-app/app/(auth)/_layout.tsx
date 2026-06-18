/**
 * @file app/(auth)/_layout.tsx
 * @description Auth group layout — stack navigator for login and sign-up screens.
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ animation: 'fade' }} />
      <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
