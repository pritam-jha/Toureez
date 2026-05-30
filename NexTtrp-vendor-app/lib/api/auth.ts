/**
 * @file lib/api/auth.ts
 * @description Authentication API functions for the Vendor Portal.
 *
 * Uses Supabase Auth directly for sign-in/sign-out.
 * The backend is not involved in authentication — only in fetching the
 * vendor's profile and company status after the Supabase session is established.
 *
 * Role enforcement: Only users with role = 'company_owner' may access
 * the vendor portal. Non-vendor users are redirected to login on cold start.
 */

import { supabase } from '../supabase';
import type { ApiResponse, User } from '../../types';
import { VENDOR_ROLE } from '../../types';

const PROFILE_SELECT = 'id, full_name, avatar_url, phone, city, state, role, created_at';

/**
 * Fetches the profile for the currently authenticated user.
 * Returns null if the user is not authenticated or has no profile row.
 */
export async function getMyProfile(): Promise<User | null> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError !== null || session === null) return null;

    const { data, error } = await supabase
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', session.user.id)
      .maybeSingle();

    if (error !== null || data === null) return null;
    return data as User;
  } catch {
    return null;
  }
}

/**
 * Signs the vendor in with email and password.
 * Returns an error if the credentials are invalid or the account
 * does not have the company_owner role.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<ApiResponse<User>> {
  try {
    if (!email.trim() || !password) {
      return { data: null, error: 'Email and password are required.' };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError !== null || authData.user === null) {
      return { data: null, error: authError?.message ?? 'Sign in failed.' };
    }

    // Fetch profile to get the database role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError !== null || profile === null) {
      await supabase.auth.signOut();
      return { data: null, error: 'Could not load your account profile. Please try again.' };
    }

    const user = profile as User;

    // FIXED: 2 - Vendor portal only allows company_owner role.
    if (user.role !== VENDOR_ROLE) {
      await supabase.auth.signOut();
      return {
        data: null,
        error: 'This portal is for vendors only. Please use the traveler app to sign in.',
      };
    }

    return { data: user, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'An unexpected error occurred.' };
  }
}

/**
 * Registers a new vendor account with email and password.
 *
 * Passes `role: 'company_owner'` and `full_name` as user metadata so the
 * database trigger (`handle_new_user`) can insert the public.users row with
 * the correct role on first sign-in.
 *
 * Returns `needsEmailVerification: true` when Supabase has email
 * confirmation enabled — the vendor must verify before signing in.
 */
export async function signUpAsVendor(
  fullName: string,
  email: string,
  password: string,
): Promise<ApiResponse<{ needsEmailVerification: boolean }>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: VENDOR_ROLE,
        },
      },
    });

    if (error !== null) {
      return { data: null, error: error.message };
    }

    if (data.user === null) {
      return { data: null, error: 'Sign up failed. Please try again.' };
    }

    // If no session was returned, email confirmation is required.
    const needsEmailVerification = data.session === null;

    return { data: { needsEmailVerification }, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    };
  }
}

/**
 * Signs the currently authenticated user out.
 * Clears the Supabase session and AsyncStorage token.
 */
export async function signOut(): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error !== null) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Sign out failed.' };
  }
}

/**
 * Updates the vendor's basic profile fields (name, phone, city, state, avatar).
 * Role changes are not permitted — only admins can change roles.
 */
export async function updateProfile(updates: {
  full_name?: string;
  phone?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
}): Promise<ApiResponse<User>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session === null) return { data: null, error: 'Not authenticated.' };

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select(PROFILE_SELECT)
      .single();

    if (error !== null) return { data: null, error: error.message };
    return { data: data as User, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Profile update failed.' };
  }
}
