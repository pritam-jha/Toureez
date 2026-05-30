/**
 * @file store/authStore.ts
 * @description Zustand store for authentication state.
 *
 * Holds both the raw Supabase Session (for JWT access) and the derived
 * User profile (for display). The session is needed by any component
 * that must attach a Bearer token to a non-Supabase request (e.g. a
 * custom backend or a signed Cloudinary upload).
 *
 * We do NOT persist this store to AsyncStorage because Supabase's own
 * AsyncStorage adapter already persists the session token. On app restart,
 * _layout.tsx re-reads the Supabase session and calls setSession().
 * Persisting here would create a stale-data risk if the token expires
 * between app launches.
 */

import { create } from 'zustand';
import type { Href } from 'expo-router';
// FIXED: 1 - Auth store helpers route users by the role loaded from public.users.
import { VENDOR_ROLE, type AuthState, type UserRole } from '../types';

// FIXED: 1 - Shared role selector for callers that need typed role access.
export const selectUserRole = (state: AuthState): UserRole | undefined =>
  state.user?.role;

// Central mapping for post-login and cold-start role redirects.
// Admin users should use the dedicated NexTtrp-admin-app, not this consumer app.
// If an admin somehow lands here, redirect to login so they can sign out.
export const getHomeRouteForRole = (role: UserRole | null | undefined): Href => {
  if (role === 'admin') return '/(auth)/login' as Href;
  if (role === VENDOR_ROLE) return '/(vendor)' as Href;
  return '/(tabs)';
};

// Compare current Expo Router segment with the role-specific home group.
// Admin role is no longer served by this consumer app (use NexTtrp-admin-app instead).
export const getHomeGroupForRole = (
  role: UserRole | null | undefined
): '(tabs)' | '(vendor)' => {
  if (role === VENDOR_ROLE) return '(vendor)';
  return '(tabs)';
};

/**
 * Zustand auth store.
 *
 * - `user`: null when logged out, populated User object when authenticated.
 * - `session`: null when logged out, raw Supabase Session when authenticated.
 * - `isLoading`: true until the initial session check in _layout.tsx resolves.
 *   Prevents the auth gate from flashing the login screen on cold start.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  /**
   * Sets the current user profile only.
   * Use setSession when you have both user and session available.
   */
  setUser: (user) => set({ user }),

  /**
   * Atomically sets both the user profile and the raw session.
   * Called by the onAuthStateChange listener in _layout.tsx so both
   * values are available to consumers in the same render cycle.
   */
  setSession: (user, session) => set({ user, session }),

  /**
   * Updates the loading state. Called once the initial session
   * check in _layout.tsx completes (regardless of outcome).
   */
  setLoading: (loading) => set({ isLoading: loading }),

  /**
   * Clears both user and session state on logout.
   * The Supabase session is cleared by lib/api/users.ts signOut()
   * before this is called.
   */
  clearUser: () => set({ user: null, session: null }),
}));

// FIXED: 7 - Typed role selector for useAuthStore(s => s.user?.role) consumers.
export const useUserRole = (): UserRole | undefined =>
  useAuthStore((state) => state.user?.role);
