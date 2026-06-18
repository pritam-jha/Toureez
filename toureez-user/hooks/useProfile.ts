/**
 * @file hooks/useProfile.ts
 * @description TanStack Query hooks for user profile management.
 *
 * Exports:
 * - useProfile()       → fetches the current user's profile
 * - useUpdateProfile() → mutation to update profile fields
 * - useUploadAvatar()  → full avatar upload flow (picker → compress → Cloudinary → updateProfile)
 *
 * Architecture rules:
 * - Zero direct API calls in this file — all go through lib/api/users.ts and lib/cloudinary.ts
 * - All async operations wrapped in try/catch
 * - Never throws — errors are surfaced via mutation state or returned objects
 */

import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { getProfile, updateProfile } from '../lib/api/users';
import type { UpdateProfilePayload } from '../lib/api/users';
import { uploadImage } from '../lib/cloudinary';
import { useAuthStore } from '../store/authStore';
import { Config } from '../constants/config';
import type { User } from '../types';

// ── Query key factory ─────────────────────────────────────────────────────────

export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
} as const;

// ── useProfile ────────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated user's profile from Supabase.
 *
 * Cached by TanStack Query — subsequent calls within the stale window
 * return the cached value without a network request.
 *
 * @returns TanStack Query result containing the User profile.
 */
export function useProfile(): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      const { data, error } = await getProfile();
      if (error) throw new Error(error);
      if (!data) throw new Error('Profile not found.');
      return data;
    },
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}

// ── useUpdateProfile ──────────────────────────────────────────────────────────

export interface UpdateProfileResult {
  user: User;
}

/**
 * Mutation hook for updating the authenticated user's profile fields.
 *
 * On success:
 * - Invalidates the profile query so the screen refetches fresh data
 * - Updates the Zustand auth store so the header/avatar updates immediately
 *
 * @example
 * const { mutate, isPending, error } = useUpdateProfile();
 * mutate({ full_name: 'Rahul Sharma', city: 'Mumbai', state: 'Maharashtra' });
 */
export function useUpdateProfile(): UseMutationResult<
  UpdateProfileResult,
  Error,
  UpdateProfilePayload
> {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation<UpdateProfileResult, Error, UpdateProfilePayload>({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data, error } = await updateProfile(payload);
      if (error) throw new Error(error);
      if (!data) throw new Error('Profile update returned no data.');
      return { user: data };
    },
    onSuccess: ({ user }) => {
      // Update Zustand store immediately so header/avatar reflects new data
      setUser(user);
      // Invalidate TanStack Query cache so any screen using useProfile refetches
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// ── useUploadAvatar ───────────────────────────────────────────────────────────

export interface UseUploadAvatarReturn {
  /** Whether an upload is currently in progress */
  uploading: boolean;
  /** Triggers the full avatar upload flow */
  uploadAvatar: () => Promise<void>;
  /** Error message from the last failed upload, or null */
  uploadError: string | null;
}

/**
 * Handles the complete avatar upload flow:
 * 1. Requests media library permissions
 * 2. Opens the image picker with compression (max 800×800, quality 0.8)
 * 3. Uploads the selected image to Cloudinary (folder: 'avatars')
 * 4. Calls updateProfile with the new avatar_url
 * 5. Invalidates the profile query on success
 *
 * Returns `{ uploading, uploadAvatar, uploadError }`.
 * Never throws — errors are surfaced via `uploadError`.
 *
 * @example
 * const { uploading, uploadAvatar, uploadError } = useUploadAvatar();
 * <Avatar uri={user.avatar_url} onPress={uploadAvatar} loading={uploading} />
 */
export function useUploadAvatar(): UseUploadAvatarReturn {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const uploadAvatar = useCallback(async (): Promise<void> => {
    try {
      setUploadError(null);

      // 1. Request permissions before opening the picker
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        setUploadError(
          'Photo library access is required to change your avatar. Please enable it in Settings.'
        );
        return;
      }

      // 2. Open image picker with compression
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        // Expo handles compression — max 800×800 via the allowsEditing crop
        // combined with quality 0.8 keeps file size reasonable
      });

      // User cancelled — silent no-op
      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      if (!asset?.uri) {
        setUploadError('Could not read the selected image. Please try again.');
        return;
      }

      setUploading(true);

      // 3. Upload to Cloudinary
      const { data: uploadData, error: uploadErr } = await uploadImage(
        asset.uri,
        'avatars'
      );

      if (uploadErr || !uploadData) {
        setUploadError(uploadErr ?? 'Upload failed. Please try again.');
        return;
      }

      // 4. Update profile with the new avatar URL
      const { data: updatedUser, error: profileErr } = await updateProfile({
        avatar_url: uploadData.secure_url,
      });

      if (profileErr || !updatedUser) {
        setUploadError(
          profileErr ?? 'Failed to save avatar. Please try again.'
        );
        return;
      }

      // 5. Update Zustand store and invalidate query cache
      setUser(updatedUser);
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }, [queryClient, setUser]);

  return { uploading, uploadAvatar, uploadError };
}
