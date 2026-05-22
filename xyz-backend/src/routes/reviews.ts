/**
 * @file routes/reviews.ts
 * @description Reviews & Ratings API routes.
 *
 * POST /api/v1/reviews                        — Submit a review (protected)
 * GET  /api/v1/reviews/package/:packageId     — Get published reviews (public)
 * GET  /api/v1/reviews/eligible/:packageId    — Check eligibility (protected)
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { defaultLimiter } from '../middleware/rateLimiter';
import {
  createReview,
  getPackageReviews,
  getReviewEligibility,
} from '../services/reviewService';
import { success, validationError } from '../utils/response';
import { UuidParamSchema } from '../utils/validation';

export const reviewsRouter = Router();

reviewsRouter.use(defaultLimiter);

// ── Validation schemas ────────────────────────────────────────────────────────

const RatingField = z
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5')
  .optional();

const CreateReviewSchema = z
  .object({
    booking_id: z.string().uuid('Invalid booking ID'),
    package_id: z.string().uuid('Invalid package ID'),
    rating_guide: RatingField,
    rating_hotel: RatingField,
    rating_food: RatingField,
    rating_transport: RatingField,
    rating_value: RatingField,
    title: z
      .string()
      .trim()
      .max(100, 'Title must be at most 100 characters')
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
    body: z
      .string()
      .trim()
      .max(1000, 'Review body must be at most 1000 characters')
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
  })
  .strict()
  .refine(
    (data) =>
      data.rating_guide !== undefined ||
      data.rating_hotel !== undefined ||
      data.rating_food !== undefined ||
      data.rating_transport !== undefined ||
      data.rating_value !== undefined,
    {
      message: 'At least one rating category must be provided.',
      path: ['rating_guide'],
    }
  );

const PackageReviewsQuerySchema = z.object({
  page: z
    .preprocess(
      (v) => (v === undefined || v === '' ? 1 : v),
      z.coerce.number().int().min(1)
    )
    .default(1),
  limit: z
    .preprocess(
      (v) => (v === undefined || v === '' ? 10 : v),
      z.coerce.number().int().min(1).max(50)
    )
    .default(10),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/reviews
 * Submits a new review for a completed booking.
 *
 * Protected — requires a valid Bearer token.
 * Validates: booking ownership, completed status, no duplicate, ≥1 rating.
 */
reviewsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = CreateReviewSchema.safeParse(req.body);

    if (!parsed.success) {
      return validationError(res, parsed.error.flatten().fieldErrors);
    }

    const review = await createReview(req.user!.id, {
      booking_id: parsed.data.booking_id,
      package_id: parsed.data.package_id,
      rating_guide: parsed.data.rating_guide,
      rating_hotel: parsed.data.rating_hotel,
      rating_food: parsed.data.rating_food,
      rating_transport: parsed.data.rating_transport,
      rating_value: parsed.data.rating_value,
      title: parsed.data.title,
      body: parsed.data.body,
    });

    return success(res, review, 201);
  } catch (caughtError) {
    return next(caughtError);
  }
});

/**
 * GET /api/v1/reviews/package/:packageId
 * Returns paginated published reviews for a package.
 *
 * Public route — no auth required.
 * Query params: page (default 1), limit (default 10, max 50)
 * Ordered by created_at desc.
 */
reviewsRouter.get('/package/:packageId', async (req, res, next) => {
  try {
    const { id: packageId } = UuidParamSchema.parse({
      id: req.params.packageId,
    });

    const queryParsed = PackageReviewsQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      return validationError(res, queryParsed.error.flatten().fieldErrors);
    }

    const { page, limit } = queryParsed.data;
    const result = await getPackageReviews(packageId, page, limit);

    return success(res, result);
  } catch (caughtError) {
    return next(caughtError);
  }
});

/**
 * GET /api/v1/reviews/eligible/:packageId
 * Checks if the authenticated user can review the given package.
 *
 * Protected — requires a valid Bearer token.
 * Returns { can_review: boolean, booking_id?: string }
 */
reviewsRouter.get('/eligible/:packageId', requireAuth, async (req, res, next) => {
  try {
    const { id: packageId } = UuidParamSchema.parse({
      id: req.params.packageId,
    });

    const eligibility = await getReviewEligibility(req.user!.id, packageId);

    return success(res, eligibility);
  } catch (caughtError) {
    return next(caughtError);
  }
});
