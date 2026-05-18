/**
 * @file app/index.tsx
 * @description Root index — single source of truth for auth-based routing.
 *
 * This is the ONLY place that decides where to send the user on app open.
 * app/_layout.tsx resolves the session and updates the store; this file
 * reads the store and issues the declarative <Redirect>.
 *
 * FIX (audit Warning §10): Previously _layout.tsx also called
 * router.replace() imperatively via a useEffect, causing a double
 * navigation event on cold start. That useEffect has been removed.
 * All routing now flows through this single <Redirect>.
 */

import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { FullScreenLoader } from '../components/ui/LoadingSpinner';

/**
 * Root index screen.
 *
 * Renders a full-screen loader while the session check is in progress
 * (isLoading = true), then issues a single declarative redirect based
 * on whether a user is authenticated.
 */
export default function Index(): React.ReactElement {
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  // Session check still in progress — show loader, do not redirect yet
  if (isLoading) {
    return <FullScreenLoader />;
  }

  // Session resolved — route to the correct group
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
