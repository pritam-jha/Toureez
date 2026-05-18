/**
 * @file hooks/usePackages.ts
 * @description TanStack Query hooks for packages and wishlist mutations.
 *
 * All data fetching and mutations go through these hooks.
 * Components never call lib/api/* directly.
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UseQueryResult,
  UseInfiniteQueryResult,
  UseMutationResult,
  InfiniteData,
} from '@tanstack/react-query';

import {
  searchPackages,
  getPackageById,
  getFeaturedPackages,
  getPackagesByCategory,
} from '../lib/api/packages';
import { toggleWishlist } from '../lib/api/wishlist';
import { useWishlistStore } from '../store/wishlistStore';
import { Config } from '../constants/config';
import type { Package, PackageImage, PackageCategory, SearchFilters } from '../types';

// ── Query key factories ───────────────────────────────────────────────────────

/**
 * Centralised query key factory for packages.
 * Invalidating `packagesKeys.all` clears every package-related query at once.
 */
export const packagesKeys = {
  all: ['packages'] as const,
  lists: () => [...packagesKeys.all, 'list'] as const,
  list: (filters: SearchFilters) => [...packagesKeys.lists(), filters] as const,
  featured: () => [...packagesKeys.all, 'featured'] as const,
  byCategory: (category: PackageCategory) =>
    [...packagesKeys.all, 'category', category] as const,
  details: () => [...packagesKeys.all, 'detail'] as const,
  detail: (id: string) => [...packagesKeys.details(), id] as const,
} as const;

/**
 * Centralised query key factory for wishlist queries.
 * Invalidating `wishlistKeys.all` clears both the ID list and the full list.
 */
export const wishlistKeys = {
  all: ['wishlist'] as const,
  ids: () => [...wishlistKeys.all, 'ids'] as const,
  packages: () => [...wishlistKeys.all, 'packages'] as const,
} as const;

// ── Package query hooks ───────────────────────────────────────────────────────

/**
 * Fetches featured packages for the home screen hero section.
 *
 * @returns TanStack Query result with an array of featured packages.
 */
export function useFeaturedPackages(): UseQueryResult<Package[], Error> {
  return useQuery({
    queryKey: packagesKeys.featured(),
    queryFn: async () => {
      const { data, error } = await getFeaturedPackages();
      if (error) throw new Error(error);
      return data ?? [];
    },
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}

/**
 * Fetches packages for a specific category carousel on the home screen.
 *
 * @param category - The package category to fetch.
 * @param limit - Maximum number of packages to return.
 * @returns TanStack Query result with an array of packages.
 */
export function usePackagesByCategory(
  category: PackageCategory,
  limit: number = 10
): UseQueryResult<Package[], Error> {
  return useQuery({
    queryKey: packagesKeys.byCategory(category),
    queryFn: async () => {
      const { data, error } = await getPackagesByCategory(category, limit);
      if (error) throw new Error(error);
      return data ?? [];
    },
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}

/**
 * Fetches a single package by ID, including its images.
 * The query is disabled when no ID is provided.
 *
 * @param packageId - The UUID of the package to fetch, or null/undefined.
 * @returns TanStack Query result with the package and its images.
 */
export function usePackage(
  packageId: string | null | undefined
): UseQueryResult<Package & { images: PackageImage[] }, Error> {
  return useQuery({
    queryKey: packagesKeys.detail(packageId ?? ''),
    queryFn: async () => {
      if (!packageId) throw new Error('Package ID is required.');
      const { data, error } = await getPackageById(packageId);
      if (error) throw new Error(error);
      if (!data) throw new Error('Package not found.');
      return data;
    },
    enabled: Boolean(packageId),
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}

/**
 * Infinite query hook for the search/browse screen.
 * Fetches packages page by page as the user scrolls.
 *
 * @param filters - Search and filter parameters.
 * @returns TanStack InfiniteQuery result with paginated package arrays.
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useSearchPackages(filters);
 * const allPackages = data?.pages.flatMap((page) => page) ?? [];
 */
export function useSearchPackages(
  filters: SearchFilters
): UseInfiniteQueryResult<InfiniteData<Package[]>, Error> {
  return useInfiniteQuery({
    queryKey: packagesKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 0;
      const { data, error } = await searchPackages(filters, page);
      if (error) throw new Error(error);
      return data ?? [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < Config.packagesPageSize) return undefined;
      return allPages.length;
    },
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}

// ── Wishlist mutation hook ────────────────────────────────────────────────────

/** Variables accepted by the useToggleWishlist mutation */
export interface ToggleWishlistVariables {
  /** UUID of the package to toggle */
  packageId: string;
  /** Current wishlist state — true means it IS wishlisted right now */
  isCurrentlyWishlisted: boolean;
}

/**
 * Mutation hook for toggling a package's wishlist state.
 *
 * Performs an optimistic update on the Zustand store immediately so the
 * heart icon flips without waiting for the network. On error, the store
 * is rolled back to the previous state. On success, the TanStack Query
 * wishlist cache is invalidated so any screen showing full wishlist data
 * refetches automatically.
 *
 * @example
 * const { mutate: toggleWishlist, isPending } = useToggleWishlist();
 * toggleWishlist({ packageId: pkg.id, isCurrentlyWishlisted: isWishlisted(pkg.id) });
 */
export function useToggleWishlist(): UseMutationResult<
  { wishlisted: boolean },
  Error,
  ToggleWishlistVariables
> {
  const queryClient = useQueryClient();
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  return useMutation<{ wishlisted: boolean }, Error, ToggleWishlistVariables>({
    mutationFn: async ({ packageId, isCurrentlyWishlisted }: ToggleWishlistVariables) => {
      const { data, error } = await toggleWishlist(packageId, isCurrentlyWishlisted);
      if (error) throw new Error(error);
      if (!data) throw new Error('Toggle wishlist failed: no response.');
      return data;
    },

    /**
     * Optimistic update: flip the Zustand store immediately so the UI
     * responds instantly. We capture the previous state so we can roll
     * back if the API call fails.
     */
    onMutate: ({ packageId, isCurrentlyWishlisted }: ToggleWishlistVariables) => {
      if (isCurrentlyWishlisted) {
        removeFromWishlist(packageId);
      } else {
        addToWishlist(packageId);
      }
      // Return context for rollback in onError
      return { packageId, wasWishlisted: isCurrentlyWishlisted };
    },

    /**
     * Rollback the optimistic update if the API call fails.
     */
    onError: (
      _error: Error,
      _variables: ToggleWishlistVariables,
      context: unknown
    ) => {
      const ctx = context as { packageId: string; wasWishlisted: boolean } | undefined;
      if (!ctx) return;
      // Restore previous state
      if (ctx.wasWishlisted) {
        addToWishlist(ctx.packageId);
      } else {
        removeFromWishlist(ctx.packageId);
      }
    },

    /**
     * Invalidate the wishlist query cache on success so any screen
     * showing full package data (not just IDs) refetches automatically.
     */
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
