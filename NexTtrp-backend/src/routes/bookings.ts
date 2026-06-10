/**
 * @file routes/bookings.ts
 * @description Booking flow API routes (all protected).
 *
 * POST /api/v1/bookings/create                 — Create a pending booking
 * POST /api/v1/bookings/create-razorpay-order  — Create Razorpay order (before checkout)
 * POST /api/v1/bookings/verify-razorpay-payment — Verify payment + confirm booking
 * POST /api/v1/bookings/confirm-mock           — Mock payment (dev/soft-launch only)
 * GET  /api/v1/bookings                        — List user's bookings
 * GET  /api/v1/bookings/:id                    — Get single booking detail
 */

import { Router } from 'express';
import { z } from 'zod';
import { IS_PRODUCTION } from '../config';
import { requireAuth } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
import {
  cancelBooking,
  confirmMockPayment,
  createBooking,
  getBookingById,
  getMyBookings,
} from '../services/bookingService';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/razorpayService';
import { createBalancePaymentOrder, verifyBalancePayment } from '../services/balancePaymentService';
import { success, validationError, error as errorResponse } from '../utils/response';
import { UuidParamSchema } from '../utils/validation';

// Set ENABLE_MOCK_PAYMENT=true in your deployment env to keep mock payment
// active for soft-launch testing even when NODE_ENV=production.
const mockPaymentEnabled = process.env.ENABLE_MOCK_PAYMENT === 'true';

export const bookingsRouter = Router();

bookingsRouter.use(defaultLimiter);
bookingsRouter.use(requireAuth);

// ── Validation schemas ────────────────────────────────────────────────────────

const indianMobileRegex = /^[6-9]\d{9}$/;

const TravelerDetailSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(1, 'Age must be at least 1')
    .max(100, 'Age must be at most 100'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Gender must be male, female, or other' }),
  }),
  id_type: z.enum(['aadhaar', 'passport', 'driving_license'], {
    errorMap: () => ({
      message: 'ID type must be aadhaar, passport, or driving_license',
    }),
  }),
  id_number: z
    .string()
    .trim()
    .min(1, 'ID number is required')
    .max(50, 'ID number is too long'),
  is_primary: z.boolean(),
});

const CreateBookingSchema = z
  .object({
    package_id: z.string().uuid('Invalid package ID'),
    pricing_id: z.string().uuid('Invalid pricing ID'),
    travel_date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Travel date must be in YYYY-MM-DD format'
      )
      .refine((date) => {
        const parsed = new Date(date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return parsed >= tomorrow;
      }, 'Travel date must be at least tomorrow'),
    num_travelers: z
      .number()
      .int('Number of travelers must be a whole number')
      .min(1, 'At least 1 traveler is required')
      .max(50, 'Maximum 50 travelers allowed'),
    special_requests: z.string().trim().max(1000).optional(),
    traveler_details: z
      .array(TravelerDetailSchema)
      .min(1, 'At least one traveler is required')
      .max(50, 'Maximum 50 travelers allowed'),
    payment_type: z.enum(['full', 'advance'], {
      errorMap: () => ({ message: 'Payment type must be full or advance' }),
    }),
    // Primary contact fields (validated separately for better error messages)
    primary_contact: z.object({
      full_name: z.string().trim().min(2).max(100),
      email: z.string().trim().email('Invalid email address'),
      phone: z
        .string()
        .trim()
        .regex(indianMobileRegex, 'Invalid Indian mobile number (10 digits starting with 6-9)'),
      city: z.string().trim().min(1).max(120),
      state: z.string().trim().min(1).max(120),
    }),
  })
  .strict()
  .refine(
    (data) => data.traveler_details.length === data.num_travelers,
    {
      message: 'Number of traveler details must match num_travelers',
      path: ['traveler_details'],
    }
  )
  .refine(
    (data) => data.traveler_details.filter((t) => t.is_primary).length === 1,
    {
      message: 'Exactly one traveler must be marked as primary',
      path: ['traveler_details'],
    }
  );

const ConfirmMockPaymentSchema = z
  .object({
    booking_id: z.string().uuid('Invalid booking ID'),
    payment_type: z.enum(['full', 'advance']),
  })
  .strict();

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/bookings/create
 * Creates a pending booking with full price calculation.
 *
 * Body: CreateBookingInput + primary_contact
 * Returns: { booking, price_calculation }
 */
bookingsRouter.post('/create', async (req, res, next) => {
  try {
    const parsed = CreateBookingSchema.safeParse(req.body);

    if (!parsed.success) {
      return validationError(res, parsed.error.flatten().fieldErrors);
    }

    const result = await createBooking(req.user!.id, {
      package_id: parsed.data.package_id,
      pricing_id: parsed.data.pricing_id,
      travel_date: parsed.data.travel_date,
      num_travelers: parsed.data.num_travelers,
      special_requests: parsed.data.special_requests,
      traveler_details: parsed.data.traveler_details,
      payment_type: parsed.data.payment_type,
      // FIXED: 3 - Preserve the validated booking payload shape expected by CreateBookingInput.
      primary_contact: parsed.data.primary_contact,
    });

    return success(res, result, 201);
  } catch (caughtError) {
    return next(caughtError);
  }
});

/**
 * POST /api/v1/bookings/confirm-mock
 * Confirms a booking with a mock payment (no real gateway).
 * DISABLED in production — replace with Razorpay verify-payment before launch.
 *
 * TODO: Razorpay Integration
 * 1. Call POST /api/v1/bookings/create-order to get razorpay_order_id
 * 2. Open Razorpay checkout with order_id
 * 3. On success: call POST /api/v1/bookings/verify-payment with razorpay signature
 * 4. On failure: show error and allow retry
 *
 * NOTE: Replace this endpoint with Razorpay signature verification before launch.
 */
bookingsRouter.post('/confirm-mock', async (req, res, next) => {
  if (IS_PRODUCTION && !mockPaymentEnabled) {
    return errorResponse(res, 'Mock payment is not available in production', 410);
  }

  try {
    const parsed = ConfirmMockPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return validationError(res, parsed.error.flatten().fieldErrors);
    }

    const result = await confirmMockPayment(
      req.user!.id,
      parsed.data.booking_id,
      parsed.data.payment_type
    );

    return success(res, result);
  } catch (caughtError) {
    return next(caughtError);
  }
});

/**
 * POST /api/v1/bookings/create-razorpay-order
 * Creates a Razorpay order for a pending booking.
 * Call this before opening the Razorpay checkout UI.
 *
 * Body: { booking_id }
 * Returns: { order_id, amount, currency, key_id, booking_id }
 */
bookingsRouter.post('/create-razorpay-order', strictLimiter, async (req, res, next) => {
  try {
    const schema = z.object({ booking_id: z.string().uuid() }).strict();
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await createRazorpayOrder(parsed.data.booking_id, req.user!.id);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/v1/bookings/verify-razorpay-payment
 * Verifies Razorpay HMAC signature and confirms the booking as paid.
 * Call this after the Razorpay checkout succeeds.
 *
 * Body: { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns: { booking_id, payment_id, status }
 */
bookingsRouter.post('/verify-razorpay-payment', strictLimiter, async (req, res, next) => {
  try {
    const schema = z.object({
      booking_id:          z.string().uuid(),
      razorpay_order_id:   z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature:  z.string().min(1),
    }).strict();

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await verifyRazorpayPayment({ ...parsed.data, user_id: req.user!.id });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/v1/bookings/:id/create-balance-order
 * Creates a Razorpay order for the remaining balance of a confirmed advance booking.
 *
 * Returns: { order_id, amount, currency, key_id, booking_id }
 */
bookingsRouter.post('/:id/create-balance-order', strictLimiter, async (req, res, next) => {
  try {
    const { id } = UuidParamSchema.parse(req.params);
    const result = await createBalancePaymentOrder(id, req.user!.id);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/v1/bookings/:id/verify-balance-payment
 * Verifies Razorpay HMAC signature and settles the remaining balance.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns: { booking_id, payment_id, status }
 */
bookingsRouter.post('/:id/verify-balance-payment', strictLimiter, async (req, res, next) => {
  try {
    const { id } = UuidParamSchema.parse(req.params);

    const schema = z.object({
      razorpay_order_id:   z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature:  z.string().min(1),
    }).strict();

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await verifyBalancePayment({ booking_id: id, ...parsed.data, user_id: req.user!.id });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/bookings
 * Returns all bookings for the authenticated user, newest first.
 * Includes package title, cover image, company name.
 */
bookingsRouter.get('/', async (req, res, next) => {
  try {
    const bookings = await getMyBookings(req.user!.id);
    return success(res, bookings);
  } catch (caughtError) {
    return next(caughtError);
  }
});

/**
 * PATCH /api/v1/bookings/:id/cancel
 * Cancels a confirmed or pending booking owned by the authenticated user.
 * Returns the updated booking and calculated refund amount.
 */
bookingsRouter.patch('/:id/cancel', async (req, res, next) => {
  try {
    const { id } = UuidParamSchema.parse(req.params);
    const result = await cancelBooking(req.user!.id, id);
    return success(res, result);
  } catch (caughtError) {
    return next(caughtError);
  }
});

/**
 * GET /api/v1/bookings/:id
 * Returns full booking detail.
 * Only returns the booking if it belongs to the authenticated user.
 */
bookingsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = UuidParamSchema.parse(req.params);
    const booking = await getBookingById(req.user!.id, id);
    return success(res, booking);
  } catch (caughtError) {
    return next(caughtError);
  }
});
