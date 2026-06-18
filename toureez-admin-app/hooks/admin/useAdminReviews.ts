/**
 * @file hooks/admin/useAdminReviews.ts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import {
  getAdminReviews,
  publishAdminReview,
  unpublishAdminReview,
  verifyAdminReview,
} from '../../lib/api/admin';
import type { AdminReviewListParams } from '../../types/admin';
import type { PaginatedResponse, Review } from '../../types';

export const adminReviewQueryKeys = {
  all: ['admin', 'reviews'] as const,
  list: (params: AdminReviewListParams) => ['admin', 'reviews', 'list', params] as const,
} as const;

export function useAdminReviews(
  params: AdminReviewListParams = {},
): UseQueryResult<PaginatedResponse<Review>, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminReviewQueryKeys.list(params),
    queryFn: async () => {
      const res = await getAdminReviews(params);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load reviews');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

export function usePublishReview(): UseMutationResult<Review, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId) => {
      const res = await publishAdminReview(reviewId);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to publish review');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminReviewQueryKeys.all }),
  });
}

export function useUnpublishReview(): UseMutationResult<Review, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId) => {
      const res = await unpublishAdminReview(reviewId);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to unpublish review');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminReviewQueryKeys.all }),
  });
}

export function useVerifyReview(): UseMutationResult<Review, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId) => {
      const res = await verifyAdminReview(reviewId);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to verify review');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminReviewQueryKeys.all }),
  });
}
