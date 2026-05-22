/**
 * @file app/_layout.tsx
 * @description Root layout, session resolver, auth listener, and auth gate.
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';

import { supabase } from '../lib/supabase';
import { getProfile } from '../lib/api/users';
import { getWishlistIds } from '../lib/api/wishlist';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { FullScreenLoader } from '../components/ui/LoadingSpinner';
import { Config } from '../constants/config';
import { Colors } from '../constants/colors';

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

  // ── Navigate when auth state changes ──────────────────────────────────────
  // index.tsx only runs once on mount. After that, navigation must be
  // triggered imperatively whenever user logs in or out.
  useEffect(() => {
    // Don't navigate while the initial session check is still running
    if (isLoading) return;

    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

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
      if (event === 'SIGNED_IN' && session) {
        // Supabase auth callbacks run synchronously; defer Supabase queries
        // until this callback finishes so sign-in can resolve normally.
        setTimeout(() => {
          void getProfile().then(({ data: profile }) => {
            if (profile) {
              setSession(profile, session);
              void getWishlistIds().then(({ data: ids }) => {
                if (ids) setWishlist(ids);
              });
            }
          });
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setSession(null, null);
        setWishlist([]);
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setLoading, setSession, setWishlist]);

  if (isLoading) {
    return <FullScreenLoader message="Loading XYZ..." />;
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.backgroundBase} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="package" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="review" />
        <Stack.Screen name="compare" />
        <Stack.Screen name="notifications" />
      </Stack>
    </>
  );
}

export default function RootLayout(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
    </QueryClientProvider>
  );
}
