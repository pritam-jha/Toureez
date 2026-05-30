/**
 * @file lib/api/reviews.ts
 * @description Backend API calls for the Reviews & Ratings system.
 *
 * POST /api/v1/reviews                     — submit a new review (auth)
 * GET  /api/v1/reviews/package/:id         — paginated published reviews (public)
 * GET  /api/v1/reviews/eligible/:packageId — check review eligibility (auth)
 */

import { apiClient } from './client';
import type {
  ApiResponse,
  CreateReviewInput,
  PaginatedResponse,
  Review,
  ReviewEligibility,
} from '../../types';

// ── Functions ─────────────────────────────────────────────────────────────────

/**
 * Submits a new review for a completed booking.
 * The backend validates booking ownership, completed status, and no-duplicate.
 */
export async function submitReview(
  input: CreateReviewInput,
): Promise<ApiResponse<Review>> {
  const response = await apiClient.post<Review>('/reviews', input, true);
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to submit review.' };
  }
  return { data: response.data, error: null };
}

/**
 * Returns a paginated list of published reviews for a package.
 * Public — no auth required.
 */
export async function getPackageReviews(
  packageId: string,
  page = 1,
  limit = 10,
): Promise<ApiResponse<PaginatedResponse<Review>>> {
  const response = await apiClient.get<PaginatedResponse<Review>>(
    `/reviews/package/${encodeURIComponent(packageId)}`,
    { page, limit },
    false,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to load reviews.' };
  }
  return { data: response.data, error: null };
}

/**
 * Checks if the authenticated user can review a given package.
 * Returns { can_review: boolean, booking_id?: string }.
 */
export async function checkReviewEligibility(
  packageId: string,
): Promise<ApiResponse<ReviewEligibility>> {
  const response = await apiClient.get<ReviewEligibility>(
    `/reviews/eligible/${encodeURIComponent(packageId)}`,
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to check review eligibility.' };
  }
  return { data: response.data, error: null };
}
