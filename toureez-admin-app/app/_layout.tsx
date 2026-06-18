/**
 * @file app/_layout.tsx
 * Root layout — bootstraps Supabase auth listener, TanStack Query, and routes
 * the user to the correct screen based on their role.
 */

import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { router, SplashScreen, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
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
    queries: { retry: 1, refetchOnWindowFocus: true },
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

  // Re-focusing the app refetches stale queries automatically, so screens
  // show fresh data without a manual pull-to-refresh or logout/login.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Restore session on cold start — wrapped in try/catch so a slow or
    // failing network call never leaves the splash screen up forever.
    const bootstrap = async (): Promise<void> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Give the profile fetch 15 s; on timeout fall through to login.
          const profile = await withTimeout(getMyProfile(), 15000);

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

    // Listen for explicit sign-out only. Do NOT redirect on !session because
    // Supabase fires intermediate events with null session during the login flow
    // (e.g. before the session is persisted), which was sending users back to
    // login immediately after the login screen called router.replace('/(admin)').
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // The SIGNED_OUT event means sign-out already happened — calling
        // supabase.auth.signOut() again here re-enters the GoTrue client's
        // auth lock while the original signOut() call still holds it,
        // deadlocking and leaving the screen stuck.
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
        <StatusBar style="light" backgroundColor="#0B1426" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
