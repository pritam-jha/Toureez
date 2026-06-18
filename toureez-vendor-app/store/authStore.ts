/**
 * @file store/authStore.ts
 * @description Zustand store for authentication state in the Vendor Portal.
 *
 * Holds both the raw Supabase Session (for JWT access) and the derived
 * User profile (for display and role checks). The session is needed by
 * apiClient to attach Bearer tokens to backend requests.
 *
 * We do NOT persist this store to AsyncStorage because Supabase's own
 * AsyncStorage adapter already persists the session token. On app restart,
 * _layout.tsx re-reads the Supabase session and calls setSession().
 * Persisting here would create a stale-data risk if the token expires
 * between app launches.
 */

import { create } from 'zustand';
// FIXED: 1 - Auth store helpers route users by the role loaded from public.users.
import { VENDOR_ROLE, type AuthState, type UserRole } from '../types';

// FIXED: 1 - Shared role selector for callers that need typed role access.
export const selectUserRole = (state: AuthState): UserRole | undefined => state.user?.role;

/**
 * Returns true if the user has the company_owner role required for this app.
 */
export const selectIsVendor = (state: AuthState): boolean =>
  state.user?.role === VENDOR_ROLE;

/**
 * Zustand auth store.
 *
 * - `user`: null when logged out, populated User object when authenticated.
 * - `session`: null when logged out, raw Supabase Session when authenticated.
 * - `isLoading`: true until the initial session check in _layout.tsx resolves.
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
   */
  clearUser: () => set({ user: null, session: null }),
}));

// FIXED: 7 - Typed role selector for useAuthStore(s => s.user?.role) consumers.
export const useUserRole = (): UserRole | undefined =>
  useAuthStore((state) => state.user?.role);

/**
 * Convenience selector — returns true if the auth store is hydrated
 * and the current user has the company_owner role.
 */
export const useIsVendor = (): boolean =>
  useAuthStore((state) => state.user?.role === VENDOR_ROLE);
