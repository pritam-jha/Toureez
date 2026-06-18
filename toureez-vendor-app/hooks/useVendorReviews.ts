/**
 * @file hooks/useVendorReviews.ts
 * @description Fetches published reviews for the vendor's packages.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { listReviews } from '../lib/api/vendor';
import { useAuthStore } from '../store/authStore';
import { VENDOR_ROLE } from '../types';
import type { VendorReview, PaginatedResponse } from '../types';
import { Config } from '../constants/config';

export const vendorReviewQueryKeys = {
  all: ['vendor', 'reviews'] as const,
  list: (page: number) => ['vendor', 'reviews', 'list', page] as const,
} as const;

/**
 * Returns paginated published reviews for the vendor's packages.
 */
export function useVendorReviews(page = 1): UseQueryResult<PaginatedResponse<VendorReview>, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorReviewQueryKeys.list(page),
    queryFn: async () => {
      const { data, error } = await listReviews({ page, limit: 20 });
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load reviews');
      return data;
    },
    enabled: isVendor,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}
