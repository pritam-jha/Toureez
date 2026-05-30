/**
 * @file hooks/useSimilarPackages.ts
 * @description Fetches similar packages for a given package ID.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../lib/api/client';
import { Config } from '../constants/config';
import type { PackageListItem } from '../types';

export function useSimilarPackages(packageId: string): UseQueryResult<PackageListItem[], Error> {
  return useQuery({
    queryKey: ['packages', packageId, 'similar'],
    queryFn: async () => {
      const res = await apiClient.get<PackageListItem[]>(
        `/packages/${encodeURIComponent(packageId)}/similar`,
        undefined,
        false,
      );
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load similar packages.');
      return res.data;
    },
    enabled: packageId.trim().length > 0,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}
