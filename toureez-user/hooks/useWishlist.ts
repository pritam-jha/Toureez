/**
 * @file hooks/useWishlist.ts
 * @description Wishlist query and mutation hooks backed by the Node API.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { getWishlist, toggleWishlist } from '../lib/api/wishlist';
import { Config } from '../constants/config';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import type { PackageListItem } from '../types';

export const wishlistQueryKeys = {
  all: ['wishlist'] as const,
  ids: () => [...wishlistQueryKeys.all, 'ids'] as const,
  packages: () => [...wishlistQueryKeys.all, 'packages'] as const,
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
    queryKey: wishlistQueryKeys.ids(),
    enabled: Boolean(session?.access_token),
    queryFn: async () => {
      const { data, error } = await getWishlist();

      if (error) {
        throw new Error(error);
      }

      const ids = idsFromPackages(data ?? []);
      setWishlist(ids);

      return new Set(ids);
    },
    staleTime: 1 * 60 * 1000, // 1 min — user-specific, changes often
    gcTime: Config.queryCacheTimeMs,
  });
}

export function useWishlistPackages(): UseQueryResult<PackageListItem[], Error> {
  const session = useAuthStore((state) => state.session);
  const setWishlist = useWishlistStore((state) => state.setWishlist);

  return useQuery({
    queryKey: wishlistQueryKeys.packages(),
    enabled: Boolean(session?.access_token),
    queryFn: async () => {
      const { data, error } = await getWishlist();

      if (error) {
        throw new Error(error);
      }

      const packages = data ?? [];
      setWishlist(idsFromPackages(packages));

      return packages;
    },
    staleTime: 1 * 60 * 1000,
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

  return useMutation<
    ToggleWishlistResponse,
    Error,
    ToggleWishlistVariables,
    WishlistMutationContext
  >({
    mutationFn: async ({ packageId }) => {
      const { data, error } = await toggleWishlist(packageId, false);

      if (error) {
        throw new Error(error);
      }

      if (!data) {
        throw new Error('Wishlist update failed.');
      }

      return data;
    },
    onMutate: async ({ packageId }) => {
      await queryClient.cancelQueries({ queryKey: wishlistQueryKeys.all });

      const previousIds = new Set(useWishlistStore.getState().wishlistedIds);

      if (previousIds.has(packageId)) {
        removeFromWishlist(packageId);
      } else {
        addToWishlist(packageId);
      }

      queryClient.setQueryData<Set<string>>(
        wishlistQueryKeys.ids(),
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
      queryClient.setQueryData<PackageListItem[]>(
        wishlistQueryKeys.packages(),
        (current) => {
          if (!current || !previousIds.has(packageId)) return current;
          return current.filter((pkg) => pkg.id !== packageId);
        }
      );

      return { previousIds };
    },
    onSuccess: (data) => {
      if (data.wishlisted) {
        addToWishlist(data.package_id);
      } else {
        removeFromWishlist(data.package_id);
      }
    },
    onError: (_error, _variables, context) => {
      if (!context) return;

      setWishlist([...context.previousIds]);
      queryClient.setQueryData(wishlistQueryKeys.ids(), context.previousIds);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: wishlistQueryKeys.all,
      });
    },
  });
}
