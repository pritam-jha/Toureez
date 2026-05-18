/**
 * @file hooks/usePackage.ts
 * @description TanStack Query hook for the package detail screen.
 *
 * Calls GET /api/v1/packages/:id on the Node.js backend.
 * Returns the full PackageDetail shape including images, itineraries,
 * pricing tiers, and enriched company/location/category objects.
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '../lib/api/client';
import { Config } from '../constants/config';
import type { PackageDetail } from '../types';

// ── Query key factory ─────────────────────────────────────────────────────────

export const packageQueryKeys = {
  all: ['package'] as const,
  detail: (id: string) => ['package', id] as const,
} as const;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Fetches a single package by ID from the Node.js backend.
 *
 * The query is disabled when id is empty so the screen can safely call
 * this hook before the param is resolved by Expo Router.
 *
 * @param id - The UUID of the package to fetch.
 *
 * @example
 * const { data, isLoading, isError, refetch } = usePackageDetail(id);
 */
export function usePackageDetail(
  id: string
): UseQueryResult<PackageDetail, Error> {
  return useQuery({
    queryKey: packageQueryKeys.detail(id),
    queryFn: async () => {
      if (!id || id.trim() === '') {
        throw new Error('Package ID is required.');
      }

      const response = await apiClient.get<PackageDetail>(
        `/packages/${encodeURIComponent(id)}`,
        undefined,
        false
      );

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Package not found.');
      }

      return response.data;
    },
    enabled: Boolean(id && id.trim().length > 0),
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: (failureCount, error) => {
      // Don't retry 404s — the package genuinely doesn't exist
      if (error.message.includes('not found') || error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
