/**
 * @file store/authStore.ts
 * Zustand auth store — identical shape to the user app for hook compatibility.
 */
import { create } from 'zustand';
import type { AuthState, UserRole } from '../types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (user, session) => set({ user, session }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearUser: () => set({ user: null, session: null }),
}));

export const useUserRole = (): UserRole | undefined =>
  useAuthStore((s) => s.user?.role);
