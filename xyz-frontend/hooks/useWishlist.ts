/**
 * @file hooks/useWishlist.ts
 * @description Wishlist query and mutation hooks backed by the Node API.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '../lib/api/client';
import { Config } from '../constants/config';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import type { PackageListItem } from '../types';

export const wishlistQueryKeys = {
  all: ['wishlist'] as const,
} as const;

export interface ToggleWishlistVariables {
  packageId: string;
}

export interface ToggleWishlistResponse {
  package_id: string;
  wishlisted: boolean;
}

interface WishlistMutationContext {
  previousIds: Set<string>;
}

function idsFromPackages(packages: PackageListItem[]): string[] {
  return packages.map((pkg) => pkg.id);
}

export function useWishlistIds(): UseQueryResult<Set<string>, Error> {
  const session = useAuthStore((state) => state.session);
  const setWishlist = useWishlistStore((state) => state.setWishlist);

  return useQuery({
    queryKey: wishlistQueryKeys.all,
    enabled: Boolean(session?.access_token),
    queryFn: async () => {
      const response = await apiClient.get<PackageListItem[]>(
        '/wishlist',
        undefined,
        true
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const ids = idsFromPackages(response.data ?? []);
      setWishlist(ids);

      return new Set(ids);
    },
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}

export function useToggleWishlist(): UseMutationResult<
  ToggleWishlistResponse,
  Error,
  ToggleWishlistVariables,
  WishlistMutationContext
> {
  const queryClient = useQueryClient();
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const setWishlist = useWishlistStore((state) => state.setWishlist);
  const wishlistedIds = useWishlistStore((state) => state.wishlistedIds);

  return useMutation<
    ToggleWishlistResponse,
    Error,
    ToggleWishlistVariables,
    WishlistMutationContext
  >({
    mutationFn: async ({ packageId }) => {
      const response = await apiClient.post<ToggleWishlistResponse>(
        '/wishlist/toggle',
        { package_id: packageId },
        true
      );

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Wishlist update failed.');
      }

      return response.data;
    },
    onMutate: async ({ packageId }) => {
      await queryClient.cancelQueries({ queryKey: wishlistQueryKeys.all });

      const previousIds = new Set(wishlistedIds);

      if (previousIds.has(packageId)) {
        removeFromWishlist(packageId);
      } else {
        addToWishlist(packageId);
      }

      queryClient.setQueryData<Set<string>>(
        wishlistQueryKeys.all,
        (current) => {
          const next = new Set(current ?? previousIds);

          if (next.has(packageId)) {
            next.delete(packageId);
          } else {
            next.add(packageId);
          }

          return next;
        }
      );

      return { previousIds };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;

      setWishlist([...context.previousIds]);
      queryClient.setQueryData(wishlistQueryKeys.all, context.previousIds);

      // Log the actual error so it's visible during development
      console.warn('[useToggleWishlist] Failed:', _error?.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: wishlistQueryKeys.all,
      });
    },
  });
}
