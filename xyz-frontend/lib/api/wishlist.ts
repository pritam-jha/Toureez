/**
 * @file lib/api/wishlist.ts
 * @description All Supabase queries related to user wishlists.
 * RLS policies on the wishlists table ensure users can only access
 * their own data — we never pass user_id manually; the session handles it.
 */

import { supabase } from '../supabase';
import type { ApiResponse, Package, Wishlist } from '../../types';

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

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated user's wishlist, joined with full package data.
 *
 * Uses a Supabase join so we get the package details in a single round-trip
 * rather than N+1 queries. RLS ensures only the current user's rows are returned.
 *
 * @returns Typed ApiResponse containing an array of wishlisted packages.
 */
export async function getWishlist(): Promise<ApiResponse<Package[]>> {
  try {
    // Join wishlists → packages in one query
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        created_at,
        package_id,
        packages (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: `Failed to fetch wishlist: ${error.message}`,
      };
    }

    // Extract the nested package objects from the join result
    const packages: Package[] = (data ?? [])
      .map((row) => {
        // Supabase returns the joined table as a nested object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pkg = (row as any).packages;
        return pkg as Package | null;
      })
      .filter((pkg): pkg is Package => pkg !== null);

    return { data: packages, error: null };
  } catch (err) {
    return {
      data: null,
      error: `getWishlist: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Fetches only the package IDs in the authenticated user's wishlist.
 * Used to hydrate the Zustand wishlist store on app startup.
 *
 * @returns Typed ApiResponse containing an array of package ID strings.
 */
export async function getWishlistIds(): Promise<ApiResponse<string[]>> {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select('package_id');

    if (error) {
      return {
        data: null,
        error: `Failed to fetch wishlist IDs: ${error.message}`,
      };
    }

    const ids = (data ?? []).map((row: { package_id: string }) => row.package_id);
    return { data: ids, error: null };
  } catch (err) {
    return {
      data: null,
      error: `getWishlistIds: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Adds a package to the authenticated user's wishlist.
 *
 * The `user_id` is intentionally omitted from the insert payload —
 * the RLS `with check (auth.uid() = user_id)` policy combined with
 * a database default would handle it, but Supabase requires explicit
 * user_id on insert. We retrieve it from the current session to avoid
 * any client-side spoofing risk.
 *
 * @param packageId - The UUID of the package to wishlist.
 * @returns Typed ApiResponse containing the created Wishlist row.
 */
export async function addToWishlist(
  packageId: string
): Promise<ApiResponse<Wishlist>> {
  try {
    if (!packageId || packageId.trim().length === 0) {
      return { data: null, error: 'Package ID is required.' };
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { data: null, error: 'You must be logged in to add to wishlist.' };
    }

    const { data, error } = await supabase
      .from('wishlists')
      .insert({ package_id: packageId, user_id: session.user.id })
      .select()
      .single();

    if (error) {
      // Postgres unique constraint violation — already wishlisted
      if (error.code === '23505') {
        return { data: null, error: 'Package is already in your wishlist.' };
      }
      return {
        data: null,
        error: `Failed to add to wishlist: ${error.message}`,
      };
    }

    return { data: data as Wishlist, error: null };
  } catch (err) {
    return {
      data: null,
      error: `addToWishlist: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Removes a package from the authenticated user's wishlist.
 * RLS ensures users can only delete their own wishlist rows.
 *
 * @param packageId - The UUID of the package to remove.
 * @returns Typed ApiResponse with null data on success.
 */
export async function removeFromWishlist(
  packageId: string
): Promise<ApiResponse<null>> {
  try {
    if (!packageId || packageId.trim().length === 0) {
      return { data: null, error: 'Package ID is required.' };
    }

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('package_id', packageId);

    if (error) {
      return {
        data: null,
        error: `Failed to remove from wishlist: ${error.message}`,
      };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: `removeFromWishlist: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Toggles a package's wishlist state — adds if not present, removes if present.
 * Returns the new wishlist state so the caller can update UI optimistically.
 *
 * @param packageId - The UUID of the package to toggle.
 * @param isCurrentlyWishlisted - Current wishlist state of the package.
 * @returns Typed ApiResponse with the new wishlisted boolean state.
 */
export async function toggleWishlist(
  packageId: string,
  isCurrentlyWishlisted: boolean
): Promise<ApiResponse<{ wishlisted: boolean }>> {
  try {
    if (isCurrentlyWishlisted) {
      const { error } = await removeFromWishlist(packageId);
      if (error) return { data: null, error };
      return { data: { wishlisted: false }, error: null };
    } else {
      const { error } = await addToWishlist(packageId);
      if (error) return { data: null, error };
      return { data: { wishlisted: true }, error: null };
    }
  } catch (err) {
    return {
      data: null,
      error: `toggleWishlist: ${extractErrorMessage(err)}`,
    };
  }
}
