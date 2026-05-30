/**
 * @file lib/api/wishlist.ts
 * @description Backend API calls for authenticated wishlist business logic.
 */

import { apiClient } from './client';
import type { ApiResponse, BackendApiResponse, PackageListItem } from '../../types';

export interface WishlistMutationResult {
  package_id: string;
  wishlisted: boolean;
}

function toApiResponse<T>(response: BackendApiResponse<T>): ApiResponse<T> {
  return {
    data: response.data,
    error: response.error,
  };
}

/**
 * Fetches the authenticated user's wishlist package list.
 */
// FIXED: 6 - Wishlist reads use the backend API; direct Supabase is reserved for auth/profile/realtime.
export async function getWishlist(): Promise<ApiResponse<PackageListItem[]>> {
  const response = await apiClient.get<PackageListItem[]>('/wishlist', undefined, true);
  return toApiResponse(response);
}

/**
 * Fetches only package IDs from the authenticated user's backend wishlist.
 */
// FIXED: 6 - Hydration derives IDs from the backend wishlist response.
export async function getWishlistIds(): Promise<ApiResponse<string[]>> {
  const response = await getWishlist();

  if (response.error) {
    return { data: null, error: response.error };
  }

  return {
    data: (response.data ?? []).map((pkg) => pkg.id),
    error: null,
  };
}

/**
 * Adds a package to the authenticated user's wishlist.
 */
// FIXED: 6 - Wishlist inserts go through POST /api/v1/wishlist.
export async function addToWishlist(
  packageId: string
): Promise<ApiResponse<WishlistMutationResult>> {
  const response = await apiClient.post<WishlistMutationResult>(
    '/wishlist',
    { package_id: packageId },
    true
  );
  return toApiResponse(response);
}

/**
 * Removes a package from the authenticated user's wishlist.
 */
// FIXED: 6 - Wishlist deletes go through DELETE /api/v1/wishlist/:id.
export async function removeFromWishlist(
  packageId: string
): Promise<ApiResponse<WishlistMutationResult>> {
  const response = await apiClient.delete<WishlistMutationResult>(
    `/wishlist/${encodeURIComponent(packageId)}`,
    true
  );
  return toApiResponse(response);
}

/**
 * Toggles a package's wishlist state and returns the new backend state.
 */
// FIXED: 6 - Toggle keeps the existing caller contract while using the backend API.
export async function toggleWishlist(
  packageId: string,
  _isCurrentlyWishlisted: boolean
): Promise<ApiResponse<WishlistMutationResult>> {
  const response = await apiClient.post<WishlistMutationResult>(
    '/wishlist/toggle',
    { package_id: packageId },
    true
  );

  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Toggle wishlist failed.' };
  }

  return { data: response.data, error: null };
}
