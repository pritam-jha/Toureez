/**
 * @file lib/api/bookings.ts
 * @description Backend API calls for the traveller booking flow.
 *
 * POST /api/v1/bookings/create       — create a pending booking
 * POST /api/v1/bookings/confirm-mock — confirm with mock payment
 * GET  /api/v1/bookings              — list the user's bookings
 * GET  /api/v1/bookings/:id          — single booking detail
 * PATCH /api/v1/bookings/:id/cancel  — cancel a booking
 */

import { apiClient } from './client';
import type {
  ApiResponse,
  Booking,
  BookingSummary,
  CreateBookingInput,
  PriceCalculation,
} from '../../types';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface CreateBookingResult {
  booking: Booking;
  price_calculation: PriceCalculation;
}

export interface ConfirmMockPaymentResult {
  booking: Booking;
}

export interface CancelBookingResult {
  booking: Booking;
  refund_amount: number;
}

// ── Functions ─────────────────────────────────────────────────────────────────

/**
 * Creates a pending booking. Returns the booking and a server-computed
 * price breakdown so the UI can display exact amounts before payment.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<ApiResponse<CreateBookingResult>> {
  const response = await apiClient.post<CreateBookingResult>(
    '/bookings/create',
    input,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to create booking.' };
  }
  return { data: response.data, error: null };
}

/**
 * Confirms a pending booking with a mock payment (no real gateway).
 * Replace the body with Razorpay signature verification when integrating real payments.
 */
export async function confirmMockPayment(
  bookingId: string,
  paymentType: 'full' | 'advance',
): Promise<ApiResponse<ConfirmMockPaymentResult>> {
  const response = await apiClient.post<ConfirmMockPaymentResult>(
    '/bookings/confirm-mock',
    { booking_id: bookingId, payment_type: paymentType },
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Payment confirmation failed.' };
  }
  return { data: response.data, error: null };
}

/**
 * Returns all bookings for the authenticated user, newest first.
 */
export async function getMyBookings(): Promise<ApiResponse<BookingSummary[]>> {
  const response = await apiClient.get<BookingSummary[]>(
    '/bookings',
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to load bookings.' };
  }
  return { data: response.data, error: null };
}

/**
 * Returns full detail for a single booking owned by the authenticated user.
 */
export async function getBookingById(
  id: string,
): Promise<ApiResponse<Booking>> {
  const response = await apiClient.get<Booking>(
    `/bookings/${encodeURIComponent(id)}`,
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Booking not found.' };
  }
  return { data: response.data, error: null };
}

/**
 * Cancels a confirmed or pending booking. Returns the updated booking and
 * the calculated refund amount.
 */
export async function cancelBooking(
  id: string,
): Promise<ApiResponse<CancelBookingResult>> {
  const response = await apiClient.patch<CancelBookingResult>(
    `/bookings/${encodeURIComponent(id)}/cancel`,
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to cancel booking.' };
  }
  return { data: response.data, error: null };
}
