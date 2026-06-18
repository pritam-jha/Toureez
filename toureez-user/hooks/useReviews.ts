/**
 * @file hooks/useReviews.ts
 * @description Query and mutation hooks for the Reviews & Ratings system.
 *
 * usePackageReviews  — paginated list of published reviews for a package
 * useReviewEligibility — check if the authed user can review a package
 * useSubmitReview    — POST a new review, invalidate caches, navigate to success
 */

import { useCallback } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { router } from 'expo-router';

import {
  submitReview,
  getPackageReviews,
  checkReviewEligibility,
} from '../lib/api/reviews';
import { Config } from '../constants/config';
import { useAuthStore } from '../store/authStore';
import type {
  CreateReviewInput,
  PaginatedResponse,
  Review,
  ReviewEligibility,
} from '../types';

// ── Query keys ────────────────────────────────────────────────────────────────

export const reviewQueryKeys = {
  /** All review-related queries */
  all: ['reviews'] as const,
  /** Published reviews for a specific package */
  package: (packageId: string) => ['reviews', packageId] as const,
  /** Review eligibility for a specific package */
  eligible: (packageId: string) => ['review-eligible', packageId] as const,
} as const;

// ── usePackageReviews ─────────────────────────────────────────────────────────

const REVIEWS_PAGE_LIMIT = 10;

export interface UsePackageReviewsReturn {
  /** Flat list of all loaded reviews across pages */
  reviews: Review[];
  /** Total review count from the first page response */
  totalCount: number;
  /** Whether the first page is loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Whether the next page is being fetched */
  isFetchingNextPage: boolean;
  /** Whether there are more pages */
  hasNextPage: boolean;
  /** Fetch the next page */
  fetchNextPage: () => void;
  /** Refetch all pages */
  refetch: () => void;
}

/**
 * Loads published reviews for a package with infinite scroll pagination.
 * Public route — no auth required.
 */
export function usePackageReviews(packageId: string): UsePackageReviewsReturn {
  const query = useInfiniteQuery<PaginatedResponse<Review>, Error>({
    queryKey: reviewQueryKeys.package(packageId),
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1;
      const { data, error } = await getPackageReviews(packageId, page, REVIEWS_PAGE_LIMIT);
      if (error || !data) throw new Error(error ?? 'Failed to load reviews.');
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.page + 1 : undefined,
    enabled: packageId.trim().length > 0,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });

  const reviews =
    query.data?.pages.flatMap((page) => page.items) ?? [];

  const totalCount = query.data?.pages[0]?.total ?? 0;

  return {
    reviews,
    totalCount,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: () => { void query.fetchNextPage(); },
    refetch: () => { void query.refetch(); },
  };
}

// ── useReviewEligibility ──────────────────────────────────────────────────────

/**
 * Checks whether the authenticated user has a completed booking for the
 * given package and has not yet submitted a review.
 * Only runs when the user is authenticated.
 */
export function useReviewEligibility(
  packageId: string
): UseQueryResult<ReviewEligibility, Error> {
  const isAuthenticated = useAuthStore((state) => state.user !== null);

  return useQuery({
    queryKey: reviewQueryKeys.eligible(packageId),
    queryFn: async () => {
      const { data, error } = await checkReviewEligibility(packageId);
      if (error || !data) throw new Error(error ?? 'Failed to check review eligibility.');
      return data;
    },
    enabled: isAuthenticated && packageId.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 min — eligibility rarely changes mid-session
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

// ── useSubmitReview ───────────────────────────────────────────────────────────

export type SubmitReviewVariables = CreateReviewInput;

/**
 * Submits a new review via POST /api/v1/reviews.
 *
 * On success:
 *  - Invalidates ['reviews', packageId] so the package detail screen refreshes
 *  - Invalidates ['package', packageId] so avg_rating updates
 *  - Invalidates ['review-eligible', packageId] so the CTA disappears
 *  - Navigates to app/review/success
 *
 * On error: the mutation error is exposed to the caller for toast display.
 */
export function useSubmitReview(): UseMutationResult<
  Review,
  Error,
  SubmitReviewVariables
> {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, SubmitReviewVariables>({
    mutationFn: async (input) => {
      const { data, error } = await submitReview(input);
      if (error || !data) throw new Error(error ?? 'Failed to submit review.');
      return data;
    },
    onSuccess: (review) => {
      const { package_id: packageId } = review;

      // Refresh the reviews list for this package
      void queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.package(packageId),
      });

      // Refresh the package detail so avg_rating reflects the new review
      void queryClient.invalidateQueries({
        queryKey: ['package', packageId],
      });

      // Eligibility is now false — hide the "Write a Review" CTA
      void queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.eligible(packageId),
      });

      // Navigate to the success screen
      router.replace('/review/success' as never);
    },
  });
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Computes the average of all non-null sub-ratings in a CreateReviewInput.
 * Returns 0 if no ratings are provided.
 */
export function computeOverallRating(
  ratings: Pick<
    CreateReviewInput,
    | 'rating_guide'
    | 'rating_hotel'
    | 'rating_food'
    | 'rating_transport'
    | 'rating_value'
  >
): number {
  const values = [
    ratings.rating_guide,
    ratings.rating_hotel,
    ratings.rating_food,
    ratings.rating_transport,
    ratings.rating_value,
  ].filter((v): v is number => v !== undefined && v !== null && v > 0);

  if (values.length === 0) return 0;

  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

/**
 * Returns true if at least one sub-rating has been provided.
 */
export function hasAtLeastOneRating(
  ratings: Pick<
    CreateReviewInput,
    | 'rating_guide'
    | 'rating_hotel'
    | 'rating_food'
    | 'rating_transport'
    | 'rating_value'
  >
): boolean {
  return [
    ratings.rating_guide,
    ratings.rating_hotel,
    ratings.rating_food,
    ratings.rating_transport,
    ratings.rating_value,
  ].some((v) => v !== undefined && v !== null && v > 0);
}

/**
 * Formats a review date as "Month YYYY" (e.g. "March 2025").
 */
export function formatReviewDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Returns a hook-safe callback that fetches the next page of reviews.
 * Wraps fetchNextPage to satisfy the void-return lint rule.
 */
export function useLoadMoreReviews(
  fetchNextPage: () => Promise<unknown>
): () => void {
  return useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);
}
