/**
 * @file app/_layout.tsx
 * @description Root layout, session resolver, auth listener, and auth gate.
 */

import React, { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';
import { router } from 'expo-router';

import { supabase } from '../lib/supabase';
import { getProfile } from '../lib/api/users';
import { getWishlistIds } from '../lib/api/wishlist';
import { getHomeGroupForRole, getHomeRouteForRole, useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { FullScreenLoader } from '../components/ui/LoadingSpinner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { initialiseSentry } from '../lib/sentry';
import { Config } from '../constants/config';
import { Colors } from '../constants/colors';

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
    mutations: {
      retry: 0,
    },
  },
});

function AppLayout(): React.ReactElement {
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const setWishlist = useWishlistStore((state) => state.setWishlist);

  usePushNotifications();
  const segments = useSegments();
  const rootSegment = segments[0] as string | undefined;

  useEffect(() => {
    void ScreenCapture.allowScreenCaptureAsync().catch(() => {
      // Non-fatal — screen capture restriction is best-effort on some platforms.
    });
  }, []);

  // ── Post-login / post-logout navigation guard ─────────────────────────────
  // index.tsx handles the initial cold-start redirect (single source of truth).
  // This effect handles SUBSEQUENT auth changes — e.g. user logs in while on
  // the login screen, or session expires while the user is on a tabs screen.
  //
  // By checking which *group* the user is currently in, we avoid the double-
  // navigation race that occurs when both this effect and index.tsx's <Redirect>
  // fire simultaneously on cold start.
  useEffect(() => {
    if (isLoading) return;

    const isInAuthGroup = rootSegment === '(auth)';
    // Only (tabs) is a protected group in the traveller app.
    // Vendors use NexTtrp-vendor-app; admins use NexTtrp-admin-app.
    const isInProtectedGroup = rootSegment === '(tabs)';

    if (user && isInAuthGroup) {
      // Logged in while on an auth screen — send to the main app.
      router.replace(getHomeRouteForRole(user.role));
      return;
    }

    if (user && isInProtectedGroup && rootSegment !== getHomeGroupForRole(user.role)) {
      // FIXED: 1 - Prevent cross-role access between traveler, vendor, and admin shells.
      router.replace(getHomeRouteForRole(user.role));
      return;
    }

    if (!user && isInProtectedGroup) {
      // Session expired or logged out while inside the app — send to login.
      router.replace('/(auth)/login');
    }
  }, [isLoading, rootSegment, user]);

  useEffect(() => {
    async function resolveInitialSession(): Promise<void> {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const { data: profile } = await getProfile();

          if (profile) {
            setSession(profile, session);
            void getWishlistIds().then(({ data: ids }) => {
              if (ids) setWishlist(ids);
            });
          }
        }
      } catch {
        // Session resolution failure is non-fatal — the user will see the login screen.
      } finally {
        setLoading(false);
        await SplashScreen.hideAsync();
      }
    }

    void resolveInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session) {
        // Silently rotate the stored access token.
        const currentUser = useAuthStore.getState().user;
        if (currentUser !== null) {
          setSession(currentUser, session);
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        // User opened the password-reset deep link — navigate to reset screen.
        // The session is temporarily set by Supabase so updateUser() will work.
        // Do NOT call setSession here — we don't want the user "logged in" yet.
        router.replace('/reset-password');
      } else if (event === 'SIGNED_OUT') {
        setSession(null, null);
        setWishlist([]);
        queryClient.clear();
      }
      // SIGNED_IN handled by useSignIn.onSuccess / useSignUp.onSuccess.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setLoading, setSession, setWishlist]);

  if (isLoading) {
    return <FullScreenLoader message="Loading NEXTTRP..." />;
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.backgroundBase} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="package/[id]" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="review" />
        <Stack.Screen name="compare" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="category/[slug]" />
        <Stack.Screen name="account" />
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
