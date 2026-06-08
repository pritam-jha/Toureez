/**
 * @file lib/api/users.ts
 * @description All Supabase queries related to user profiles.
 * RLS policies ensure users can only read/update their own profile row.
 */

import { supabase } from '../supabase';
import * as Linking from 'expo-linking';
import type { ApiResponse, User } from '../../types';

// FIXED: 7 - Role changes must go through PATCH /api/v1/admin/users/:id/role, never frontend profile writes.
const PROFILE_SELECT = 'id, full_name, avatar_url, phone, city, state, role, created_at';

type ActiveSession = NonNullable<
  Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
>;

export interface OAuthCallbackParams {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  error?: string;
  error_description?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Extracts a human-readable message from an unknown error value.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Normalizes auth metadata into the shape expected by public.users.
 * This lets the app self-heal older accounts that were created before
 * the profile trigger existed or before the schema was fully applied.
 */
function buildProfilePayload(session: ActiveSession): {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: null;
  city: null;
  state: null;
  role: 'traveler';
} {
  const fullName =
    typeof session.user.user_metadata?.full_name === 'string'
      ? session.user.user_metadata.full_name
      : null;

  const avatarUrl =
    typeof session.user.user_metadata?.avatar_url === 'string'
      ? session.user.user_metadata.avatar_url
      : null;

  return {
    id: session.user.id,
    full_name: fullName,
    avatar_url: avatarUrl,
    phone: null,
    city: null,
    state: null,
    // FIXED: 7 - Missing client-created profiles are always restored as travelers.
    role: 'traveler',
  };
}

/**
 * Ensures the currently authenticated user has a corresponding public.users row.
 */
async function fetchOrCreateProfile(
  session: ActiveSession
): Promise<ApiResponse<User>> {
  const profileResponse = await supabase
    .from('users')
    // FIXED: 7 - Profile reads explicitly include role for auth routing.
    .select(PROFILE_SELECT)
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileResponse.error) {
    return {
      data: null,
      error: `Failed to fetch profile: ${profileResponse.error.message}`,
    };
  }

  const existingProfile = profileResponse.data as User | null;

  if (existingProfile) {
    return { data: existingProfile, error: null };
  }

  const createProfileResponse = await supabase
    .from('users')
    // FIXED: 7 - Fallback profile upsert preserves the safe default traveler role.
    .upsert(buildProfilePayload(session), { onConflict: 'id' })
    .select(PROFILE_SELECT)
    .single();

  if (createProfileResponse.error) {
    return {
      data: null,
      error: `Failed to create missing profile: ${createProfileResponse.error.message}`,
    };
  }

  return { data: createProfileResponse.data as User, error: null };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetches the profile of the currently authenticated user.
 *
 * Reads the user ID from the active Supabase session rather than
 * accepting it as a parameter — this prevents any possibility of
 * a caller accidentally fetching another user's profile.
 *
 * @returns Typed ApiResponse containing the User profile, or null.
 */
export async function getProfile(): Promise<ApiResponse<User>> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { data: null, error: 'No active session. Please log in.' };
    }

    return await fetchOrCreateProfile(session);
  } catch (err) {
    return {
      data: null,
      error: `getProfile: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Partial update type for user profile fields.
 * Only the fields provided will be updated — all are optional.
 */
export type UpdateProfilePayload = Partial<
  Pick<User, 'full_name' | 'avatar_url' | 'phone' | 'city' | 'state'>
>;

/**
 * Updates the authenticated user's profile with the provided fields.
 *
 * Uses the session user ID to scope the update — the RLS policy
 * `using (auth.uid() = id)` provides a second layer of protection
 * at the database level.
 *
 * @param payload - The profile fields to update.
 * @returns Typed ApiResponse containing the updated User profile.
 */
export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<ApiResponse<User>> {
  try {
    if (Object.keys(payload).length === 0) {
      return { data: null, error: 'No fields provided to update.' };
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { data: null, error: 'No active session. Please log in.' };
    }

    const updateProfileResponse = await supabase
      .from('users')
      .update(payload)
      .eq('id', session.user.id)
      // FIXED: 7 - Updated profile responses include role for store hydration.
      .select(PROFILE_SELECT)
      .single();

    if (updateProfileResponse.error) {
      return {
        data: null,
        error: `Failed to update profile: ${updateProfileResponse.error.message}`,
      };
    }

    return { data: updateProfileResponse.data as User, error: null };
  } catch (err) {
    return {
      data: null,
      error: `updateProfile: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Signs the current user out and clears the Supabase session.
 * The auth store should call `clearUser()` after this resolves.
 *
 * @returns Typed ApiResponse with null data on success.
 */
export async function signOut(): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        data: null,
        error: `Failed to sign out: ${error.message}`,
      };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: `signOut: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Signs in a user with email and password.
 * On success, the Supabase client automatically persists the session
 * to AsyncStorage via the configuration in lib/supabase.ts.
 *
 * @param email - User's email address.
 * @param password - User's password.
 * @returns Typed ApiResponse containing the User profile on success.
 */
export async function signIn(
  email: string,
  password: string
): Promise<ApiResponse<User>> {
  try {
    if (!email || !password) {
      return { data: null, error: 'Email and password are required.' };
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      return {
        data: null,
        error: `Sign in failed: ${authError.message}`,
      };
    }

    if (!authData.user) {
      return { data: null, error: 'Sign in failed: no user returned.' };
    }

    // Try to fetch the public profile row.
    // If it fails (e.g. the users table hasn't been created yet, missing RLS
    // INSERT policy, or the trigger didn't fire), we fall back to a minimal
    // User object derived directly from the Supabase auth metadata.
    // This ensures login always succeeds as long as the credentials are correct —
    // the profile can be fetched / created later by the onAuthStateChange handler.
    const profileResponse = await getProfile();

    if (profileResponse.data) {
      return profileResponse;
    }

    // Profile fetch failed — build a minimal user from auth metadata so login
    // is not blocked by a missing or inaccessible profile row.
    const { user: authUser } = authData;
    const fallbackUser: User = {
      id: authUser.id,
      full_name:
        typeof authUser.user_metadata?.full_name === 'string'
          ? authUser.user_metadata.full_name
          : null,
      avatar_url:
        typeof authUser.user_metadata?.avatar_url === 'string'
          ? authUser.user_metadata.avatar_url
          : null,
      phone: null,
      city: null,
      state: null,
      // FIXED: 1 - A missing profile cannot grant elevated access.
      role: 'traveler',
      created_at: authUser.created_at,
    };

    return { data: fallbackUser, error: null };
  } catch (err) {
    return {
      data: null,
      error: `signIn: ${extractErrorMessage(err)}`,
    };
  }
}

export const signInWithEmail = signIn;

/**
 * Registers a new user with email, password, and display name.
 * The `handle_new_user` database trigger automatically creates the
 * public.users profile row from the auth metadata.
 *
 * @param email - New user's email address.
 * @param password - New user's password (min 6 chars enforced by Supabase).
 * @param fullName - New user's display name.
 * @param phone - Optional Indian mobile number.
 * @param city - Optional city.
 * @param state - Optional state.
 * @returns Typed ApiResponse containing the new User profile on success.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  city?: string,
  state?: string,
): Promise<ApiResponse<User>> {
  try {
    if (!email || !password || !fullName) {
      return {
        data: null,
        error: 'Email, password, and full name are required.',
      };
    }

    if (password.length < 6) {
      return {
        data: null,
        error: 'Password must be at least 6 characters.',
      };
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      return {
        data: null,
        error: `Sign up failed: ${authError.message}`,
      };
    }

    if (!authData.user) {
      return { data: null, error: 'Sign up failed: no user returned.' };
    }

    // FIXED: 7 - The DB trigger creates the profile row; this fallback upsert self-heals if a session exists.
    const newUser: User = {
      id: authData.user.id,
      full_name: fullName,
      avatar_url: null,
      phone: phone ?? null,
      city: city ?? null,
      state: state ?? null,
      role: 'traveler',
      created_at: authData.user.created_at,
    };

    // FIXED: 7 - The public client can only upsert the signed-in user's own traveler profile via RLS.
    const upsertProfileResponse = await supabase
      .from('users')
      .upsert(
        {
          id: authData.user.id,
          full_name: fullName,
          avatar_url: null,
          phone: phone ?? null,
          city: city ?? null,
          state: state ?? null,
          role: 'traveler',
        },
        { onConflict: 'id' }
      )
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (upsertProfileResponse.data) {
      return { data: upsertProfileResponse.data as User, error: null };
    }

    return { data: newUser, error: null };
  } catch (err) {
    return {
      data: null,
      error: `signUp: ${extractErrorMessage(err)}`,
    };
  }
}

export const signUpWithEmail = signUp;

/**
 * Creates a Supabase Google OAuth URL for the app to open with WebBrowser.
 *
 * @param redirectTo - Deep link that Supabase should redirect back to.
 *                     Must match an allowed redirect URL in your Supabase dashboard.
 * @param state - Optional CSRF state. Omitted when empty — Supabase handles
 *                CSRF internally via the PKCE flow.
 * @returns Typed ApiResponse containing the URL to open.
 */
export async function getGoogleOAuthUrl(
  redirectTo: string,
  state?: string
): Promise<ApiResponse<string>> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        // Only include state when provided — avoids appending &state= to the URL
        ...(state ? { queryParams: { state } } : {}),
      },
    });

    if (error) {
      return {
        data: null,
        error: `Google sign in failed: ${error.message}`,
      };
    }

    if (!data.url) {
      return {
        data: null,
        error: 'Google sign in failed: no OAuth URL returned.',
      };
    }

    return { data: data.url, error: null };
  } catch (err) {
    return {
      data: null,
      error: `getGoogleOAuthUrl: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Completes Supabase OAuth after AuthSession redirects back into the app.
 */
export async function completeOAuthSignIn(
  params: OAuthCallbackParams
): Promise<ApiResponse<User>> {
  try {
    if (params.error) {
      return {
        data: null,
        error: params.error_description ?? params.error,
      };
    }

    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);

      if (error) {
        return {
          data: null,
          error: `Google sign in failed: ${error.message}`,
        };
      }
    } else if (params.access_token && params.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });

      if (error) {
        return {
          data: null,
          error: `Google sign in failed: ${error.message}`,
        };
      }
    } else {
      return {
        data: null,
        error: 'Google sign in did not return a usable session.',
      };
    }

    return await getProfile();
  } catch (err) {
    return {
      data: null,
      error: `completeOAuthSignIn: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Sends a password reset email to the provided address.
 *
 * @param email - The email address to send the reset link to.
 * @returns Typed ApiResponse with null data on success.
 */
export async function resetPassword(
  email: string
): Promise<ApiResponse<null>> {
  try {
    if (!email || email.trim().length === 0) {
      return { data: null, error: 'Email address is required.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('/reset-password'),
    });

    if (error) {
      return {
        data: null,
        error: `Failed to send reset email: ${error.message}`,
      };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: `resetPassword: ${extractErrorMessage(err)}`,
    };
  }
}

export const sendPasswordResetEmail = resetPassword;

// ── Device token (push notifications) ────────────────────────────────────────

import { apiClient } from './client';

/**
 * Registers an Expo push token with the backend so the server can send
 * push notifications to this device.
 */
export async function registerDeviceToken(
  token: string,
  platform: 'ios' | 'android',
): Promise<ApiResponse<{ saved: boolean }>> {
  const res = await apiClient.post<{ saved: boolean }>('/users/device-token', { token, platform });
  if (res.error || !res.data) return { data: null, error: res.error ?? 'Failed to register token.' };
  return { data: res.data, error: null };
}

/**
 * Removes the push token on logout.
 */
export async function unregisterDeviceToken(
  token: string,
  platform: 'ios' | 'android',
): Promise<void> {
  await apiClient.delete<{ removed: boolean }>(`/users/device-token`);
  void platform; // platform included for logging but delete uses body-less endpoint
}

// ── Account deletion ──────────────────────────────────────────────────────────

/**
 * Permanently deletes the authenticated user's account.
 * Requires the user to type "DELETE" to confirm.
 */
export async function deleteUserAccount(): Promise<ApiResponse<{ deleted: boolean }>> {
  const res = await apiClient.delete<{ deleted: boolean }>('/users/account');
  if (res.error || !res.data) return { data: null, error: res.error ?? 'Failed to delete account.' };
  return { data: res.data, error: null };
}
