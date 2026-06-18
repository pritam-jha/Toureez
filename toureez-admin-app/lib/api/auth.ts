/**
 * @file lib/api/auth.ts
 * Admin auth — reads role directly from Supabase (no backend dependency at login).
 */
import { supabase } from '../supabase';
import type { User } from '../../types';

/**
 * Sign in with email/password.
 * Reads the role from public.users via Supabase directly — no backend call needed.
 * Throws if credentials are wrong OR if the account is not an admin.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ user: User }> {
  // Step 1 — Supabase auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.session) {
    throw new Error(authError?.message ?? 'Sign in failed');
  }

  const userId = authData.user.id;

  // Step 2 — Read profile from public.users directly (no backend dependency)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, phone, city, state, role, created_at')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error('Could not load your profile. Please contact support.');
  }

  // Step 3 — Enforce admin-only access
  if (profile.role !== 'admin') {
    await supabase.auth.signOut();
    throw new Error('Access denied. This app is for admins only.');
  }

  return {
    user: {
      id: profile.id as string,
      full_name: (profile.full_name as string | null) ?? null,
      avatar_url: (profile.avatar_url as string | null) ?? null,
      phone: (profile.phone as string | null) ?? null,
      city: (profile.city as string | null) ?? null,
      state: (profile.state as string | null) ?? null,
      role: profile.role as User['role'],
      created_at: profile.created_at as string,
    },
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Restore profile from an existing Supabase session (used in root _layout.tsx).
 */
export async function getMyProfile(): Promise<User | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, phone, city, state, role, created_at')
    .eq('id', authUser.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id as string,
    full_name: (profile.full_name as string | null) ?? null,
    avatar_url: (profile.avatar_url as string | null) ?? null,
    phone: (profile.phone as string | null) ?? null,
    city: (profile.city as string | null) ?? null,
    state: (profile.state as string | null) ?? null,
    role: profile.role as User['role'],
    created_at: profile.created_at as string,
  };
}
