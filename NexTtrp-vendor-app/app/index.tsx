/**
 * @file app/index.tsx
 * @description Cold-start redirect — single source of truth for the initial route.
 *
 * Reads auth state from the store (hydrated by _layout.tsx) and redirects
 * to the appropriate screen. _layout.tsx handles SUBSEQUENT auth changes.
 */

import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { FullScreenLoader } from '../components/ui/LoadingSpinner';
import { VENDOR_ROLE } from '../types';

export default function Index(): React.ReactElement {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <FullScreenLoader message="Loading Toureez Vendor..." />;
  }

  // FIXED: 2 - Vendor portal only admits company_owner role.
  if (user !== null && user.role === VENDOR_ROLE) {
    return <Redirect href="/(vendor)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
