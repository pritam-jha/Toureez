/**
 * @file services/reviewService.ts
 * @description All database operations for the Reviews & Ratings system.
 *
 * Responsibilities:
 * - Submitting a new review (with eligibility + uniqueness checks)
 * - Fetching paginated published reviews for a package
 * - Checking review eligibility for an authenticated user
 */

import { AppError, ERROR_MESSAGES } from '../constants/errors';
// FIXED: 4 - Review publishing uses the explicitly named backend service-role client.
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../utils/logger';
import type {
  CreateReviewInput,
  PaginatedResponse,
  Review,
  ReviewEligibility,
} from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toRecord = (value: unknown): Record<string, unknown> => {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) ? first : {};
  }
  return isRecord(value) ? value : {};
};

const readString = (
  record: Record<string, unknown>,
  key: string,
  fallback = ''
): string => {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
};

const readNullableString = (
  record: Record<string, unknown>,
  key: string
): string | null => {
  const value = record[key];
  return typeof value === 'string' ? value : null;
};

const readNullableNumber = (
  record: Record<string, unknown>,
  key: string
): number | null => {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const readNumber = (
  record: Record<string, unknown>,
  key: string,
  fallback = 0
): number => readNullableNumber(record, key) ?? fallback;

const readBoolean = (
  record: Record<string, unknown>,
  key: string,
  fallback = false
): boolean => {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  logger.error({ err: dbError, op: `reviewService.${operation}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

// ── Mapper ────────────────────────────────────────────────────────────────────

/**
 * Maps a raw Supabase row (with joined user data) to a typed Review.
 */
const mapReview = (record: Record<string, unknown>): Review => {
  // FIXED: 3 - Reviews join public.users; keep the mapper aligned with that table.
  const userRaw = toRecord(record['user']);

  // Build display_name: "First L." format for privacy
  const fullName = readString(userRaw, 'full_name').trim();
  let displayName = 'Anonymous';
  if (fullName.length > 0) {
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      displayName = `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    } else {
      displayName = parts[0] ?? 'Anonymous';
    }
  }

  return {
    id: readString(record, 'id'),
    booking_id: readString(record, 'booking_id'),
    user_id: readString(record, 'user_id'),
    package_id: readString(record, 'package_id'),
    rating_guide: readNullableNumber(record, 'rating_guide'),
    rating_hotel: readNullableNumber(record, 'rating_hotel'),
    rating_food: readNullableNumber(record, 'rating_food'),
    rating_transport: readNullableNumber(record, 'rating_transport'),
    rating_value: readNullableNumber(record, 'rating_value'),
    overall_rating: readNumber(record, 'overall_rating'),
    title: readNullableString(record, 'title'),
    body: readNullableString(record, 'body'),
    is_verified: readBoolean(record, 'is_verified', true),
    is_published: readBoolean(record, 'is_published', true),
    created_at: readString(record, 'created_at'),
    user: {
      display_name: displayName,
      avatar_url: readNullableString(userRaw, 'avatar_url'),
    },
  };
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Submits a new review after verifying:
 * 1. The booking belongs to the authenticated user
 * 2. The booking status is 'completed'
 * 3. No review already exists for this booking (unique constraint)
 * 4. At least one sub-rating is provided
 *
 * Phase 2: is_published = true (immediate display, admin moderation in Phase 3)
 */
export async function createReview(
  userId: string,
  input: CreateReviewInput
): Promise<Review> {
  // ── Guard: at least one rating ────────────────────────────────────────────
  const hasRating = [
    input.rating_guide,
    input.rating_hotel,
    input.rating_food,
    input.rating_transport,
    input.rating_value,
  ].some((r) => r !== undefined && r !== null);

  if (!hasRating) {
    throw new AppError('At least one rating category must be provided.', 400);
  }

  // ── Guard: booking ownership + completed status ───────────────────────────
  const { data: bookingData, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, package_id, status')
    .eq('id', input.booking_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (bookingError !== null) throwDatabaseError('createReview.fetchBooking', bookingError);
  if (bookingData === null) throw new AppError('Booking not found.', 404);

  const bookingRecord = toRecord(bookingData);
  const bookingStatus = readString(bookingRecord, 'status');

  if (bookingStatus !== 'completed') {
    throw new AppError(
      'You can only review a package after your trip is completed.',
      403
    );
  }

  // Verify the package_id in the input matches the booking's package
  const bookingPackageId = readString(bookingRecord, 'package_id');
  if (bookingPackageId !== input.package_id) {
    throw new AppError('Package ID does not match the booking.', 400);
  }

  // ── Guard: no duplicate review for this booking ───────────────────────────
  const { data: existingReview, error: existingError } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('booking_id', input.booking_id)
    .maybeSingle();

  if (existingError !== null)
    throwDatabaseError('createReview.checkDuplicate', existingError);

  if (existingReview !== null) {
    throw new AppError('You have already reviewed this booking.', 409);
  }

  // ── Insert review ─────────────────────────────────────────────────────────
  const { data: insertedData, error: insertError } = await supabaseAdmin
    .from('reviews')
    .insert({
      booking_id: input.booking_id,
      user_id: userId,
      package_id: input.package_id,
      rating_guide: input.rating_guide ?? null,
      rating_hotel: input.rating_hotel ?? null,
      rating_food: input.rating_food ?? null,
      rating_transport: input.rating_transport ?? null,
      rating_value: input.rating_value ?? null,
      title: input.title?.trim() || null,
      body: input.body?.trim() || null,
      // is_verified = true because the booking was confirmed by the platform
      is_verified: true,
      // Phase 2: publish immediately; Phase 3 will add admin moderation
      is_published: true,
    })
    // FIXED: 3 - Join public.users instead of the non-existent profiles table.
    .select(
      `
      *,
      user:users(full_name, avatar_url)
    `
    )
    .single();

  if (insertError !== null) {
    // Unique constraint violation — race condition duplicate
    if (insertError.code === '23505') {
      throw new AppError('You have already reviewed this booking.', 409);
    }
    throwDatabaseError('createReview.insert', insertError);
  }

  if (insertedData === null) throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);

  return mapReview(toRecord(insertedData));
}

/**
 * Returns paginated published reviews for a package, newest first.
 * Includes denormalised user display name and avatar.
 * Public route — no auth required.
 */
export async function getPackageReviews(
  packageId: string,
  page: number,
  limit: number
): Promise<PaginatedResponse<Review>> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error: fetchError, count } = await supabaseAdmin
    .from('reviews')
    // FIXED: 3 - Join public.users, not the non-existent profiles table.
    .select(
      `
      *,
      user:users(full_name, avatar_url)
    `,
      { count: 'exact' }
    )
    .eq('package_id', packageId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (fetchError !== null) throwDatabaseError('getPackageReviews', fetchError);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;

  return {
    items: rows.map((row) => mapReview(toRecord(row))),
    total,
    page,
    limit,
    has_more: from + rows.length < total,
  };
}

/**
 * Checks whether the authenticated user:
 * 1. Has a completed booking for the given package
 * 2. Has NOT already submitted a review for that booking
 *
 * Returns { can_review: true, booking_id } or { can_review: false }.
 */
export async function getReviewEligibility(
  userId: string,
  packageId: string
): Promise<ReviewEligibility> {
  // Find a completed booking for this user + package
  const { data: bookingData, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('user_id', userId)
    .eq('package_id', packageId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (bookingError !== null)
    throwDatabaseError('getReviewEligibility.fetchBooking', bookingError);

  if (bookingData === null) {
    return { can_review: false };
  }

  const bookingId = readString(toRecord(bookingData), 'id');

  // Check if a review already exists for this booking
  const { data: existingReview, error: reviewError } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (reviewError !== null)
    throwDatabaseError('getReviewEligibility.checkReview', reviewError);

  if (existingReview !== null) {
    // Already reviewed
    return { can_review: false };
  }

  return { can_review: true, booking_id: bookingId };
}
