import { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

/**
 * Returns an onBack handler that navigates to the correct screen based on
 * the `from` param passed at navigation time.
 *
 * Use at the SCREEN level (not inside a child component) so that
 * useLocalSearchParams reliably reads the current route's params.
 */
export function useScreenBack(): () => void {
  const { from } = useLocalSearchParams<{ from?: string }>();

  return useCallback(() => {
    if (from === 'account') {
      router.replace('/(vendor)/account');
    } else if (from === 'dashboard') {
      router.replace('/(vendor)');
    } else {
      router.back();
    }
  }, [from]);
}
