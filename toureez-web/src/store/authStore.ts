import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  setSession: (user: AuthUser | null, session: Session | null) => void;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setSession: (user, session) => set({ user, session }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearUser: () => set({ user: null, session: null }),
}));

export const useUserRole = () => useAuthStore((state) => state.user?.role);
