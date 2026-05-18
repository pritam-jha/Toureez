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
import type { AuthState } from '../types';

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
