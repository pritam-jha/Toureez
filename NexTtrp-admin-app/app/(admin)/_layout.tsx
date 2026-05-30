/**
 * @file app/(admin)/_layout.tsx
 * Admin stack navigator. The root _layout.tsx already guards this group —
 * only authenticated admins reach this point.
 */
import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
