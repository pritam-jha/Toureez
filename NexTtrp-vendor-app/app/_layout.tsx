/**
 * @file app/_layout.tsx
 * @description Root layout — bootstraps Supabase auth listener, TanStack Query,
 * and routes the vendor to the correct screen based on their role.
 *
 * Auth flow:
 * 1. resolveInitialSession() reads the persisted Supabase session on cold start.
 * 2. If a session exists, the user's role is verified against company_owner.
 *    Non-vendor sessions are immediately signed out and redirected to login.
 * 3. onAuthStateChange handles SIGNED_IN / SIGNED_OUT events during the session.
 * 4. The auth gate effect prevents cross-role access when the user's role
 *    or the current route group changes.
 */

import React, { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack, useSegments, router, type Href } from 'expo-router';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { supabase } from '../lib/supabase';
import { getMyProfile } from '../lib/api/auth';
import { useAuthStore } from '../store/authStore';
import { FullScreenLoader } from '../components/ui/LoadingSpinner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initialiseSentry } from '../lib/sentry';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Config } from '../constants/config';
import { Colors } from '../constants/colors';
import { VENDOR_ROLE } from '../types';

initialiseSentry();

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Config.queryStaleTimeMs,
      gcTime: Config.queryCacheTimeMs,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: { retry: 0 },
  },
});

function AppLayout(): React.ReactElement {
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clearUser = useAuthStore((state) => state.clearUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const segments = useSegments();

  usePushNotifications();
  const rootSegment = segments[0] as string | undefined;

  // Re-focusing the app refetches stale queries automatically, so screens
  // show fresh data without a manual pull-to-refresh or logout/login.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  // ── Post-login / post-logout navigation guard ─────────────────────────────
  // index.tsx handles the initial cold-start redirect.
  // This effect handles SUBSEQUENT auth changes — e.g. user logs in while on
  // the login screen, or session expires while on a vendor screen.
  useEffect(() => {
    if (isLoading) return;

    const isInAuthGroup = rootSegment === '(auth)';
    const isInVendorGroup = rootSegment === '(vendor)';

    if (user !== null && isInAuthGroup) {
      // Logged in while on an auth screen — send to the vendor portal.
      router.replace('/(vendor)');
      return;
    }

    if (!user && isInVendorGroup) {
      // Session expired or logged out while inside the vendor portal.
      router.replace('/(auth)/login');
    }
  }, [isLoading, rootSegment, user]);

  useEffect(() => {
    async function resolveInitialSession(): Promise<void> {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session !== null) {
          const profile = await getMyProfile();

          if (profile === null || profile.role !== VENDOR_ROLE) {
            // Has a session but not a vendor — sign out and show login
            await supabase.auth.signOut();
            clearUser();
          } else {
            setSession(profile, session);
          }
        }
      } catch (error) {
        console.warn('[AppLayout] Failed to resolve initial session:', error);
      } finally {
        setLoading(false);
        await SplashScreen.hideAsync();
      }
    }

    void resolveInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password' as Href);
      } else if (event === 'SIGNED_IN' && session !== null) {
        if (rootSegment === 'reset-password') return;

        // Supabase auth callbacks run synchronously; defer so sign-in resolves normally.
        setTimeout(() => {
          void getMyProfile().then((profile) => {
            if (profile !== null && profile.role === VENDOR_ROLE) {
              setSession(profile, session);
            } else {
              void supabase.auth.signOut().then(() => clearUser());
            }
          });
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setSession(null, null);
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setLoading, setSession, clearUser, rootSegment]);

  if (isLoading) {
    return <FullScreenLoader message="Loading NEXTTRP Vendor..." />;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.backgroundBase} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(vendor)" />
        <Stack.Screen name="reset-password" />
      </Stack>
    </>
  );
}

export default function RootLayout(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppLayout />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
