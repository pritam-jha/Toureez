/**
 * @file app/_layout.tsx
 * Root layout — bootstraps Supabase auth listener, TanStack Query, and routes
 * the user to the correct screen based on their role.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, SplashScreen, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { getMyProfile } from '../lib/api/auth';
import { useAuthStore } from '../store/authStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initialiseSentry } from '../lib/sentry';

initialiseSentry();
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

/** Resolves with the value, or rejects after `ms` milliseconds. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms),
    ),
  ]);
}

function AuthBootstrap(): null {
  const { setSession, setLoading, clearUser } = useAuthStore();

  useEffect(() => {
    // Restore session on cold start — wrapped in try/catch so a slow or
    // failing network call never leaves the splash screen up forever.
    const bootstrap = async (): Promise<void> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Give the profile fetch 8 s; on timeout fall through to login.
          const profile = await withTimeout(getMyProfile(), 8000);

          if (profile?.role === 'admin') {
            setSession(profile, session);
            router.replace('/(admin)');
          } else {
            // Has a session but is not an admin — sign out and show login.
            await supabase.auth.signOut();
            clearUser();
            router.replace('/(auth)/login');
          }
        } else {
          router.replace('/(auth)/login');
        }
      } catch (err) {
        // Network failure, timeout, invalid/expired refresh token, or unexpected
        // error — sign out to clear any stale stored session so it doesn't keep
        // attempting (and failing) on every subsequent cold start.
        console.warn('[AuthBootstrap] session restore failed, redirecting to login:', err);
        try { await supabase.auth.signOut(); } catch { /* already signed out */ }
        clearUser();
        router.replace('/(auth)/login');
      } finally {
        setLoading(false);
        void SplashScreen.hideAsync();
      }
    };

    void bootstrap();

    // Listen for auth state changes (token revocation, sign-out from another tab,
    // or a failed token refresh — e.g. "Invalid Refresh Token" after server reset).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        try { await supabase.auth.signOut(); } catch { /* already signed out */ }
        clearUser();
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

export default function RootLayout(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ErrorBoundary catches any render-time exception from screens/components.
          Without it, a single bad render leaves the whole app as a blank screen. */}
      <ErrorBoundary>
        <AuthBootstrap />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
