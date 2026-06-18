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
import { Config } from '../../constants/config';
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

export interface RazorpayOrderResult {
  order_id:   string;
  amount:     number; // in paise
  currency:   string;
  key_id:     string;
  booking_id: string;
}

export interface RazorpayVerifyResult {
  booking_id: string;
  payment_id: string;
  status:     string;
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

/** Creates a Razorpay order for a pending booking. Call before opening checkout. */
export async function createRazorpayOrder(
  bookingId: string,
): Promise<ApiResponse<RazorpayOrderResult>> {
  const response = await apiClient.post<RazorpayOrderResult>(
    '/bookings/create-razorpay-order',
    { booking_id: bookingId },
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Could not initiate payment.' };
  }
  return { data: response.data, error: null };
}

/** Verifies Razorpay signature and confirms the booking as paid. */
export async function verifyRazorpayPayment(params: {
  booking_id:          string;
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
}): Promise<ApiResponse<RazorpayVerifyResult>> {
  const response = await apiClient.post<RazorpayVerifyResult>(
    '/bookings/verify-razorpay-payment',
    params,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Payment verification failed.' };
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

export interface BalanceOrderResult {
  order_id:   string;
  amount:     number; // in paise
  currency:   string;
  key_id:     string;
  booking_id: string;
}

export interface BalanceVerifyResult {
  booking_id: string;
  payment_id: string;
  status:     string;
}

/** Creates a Razorpay order for the outstanding balance. */
export async function createBalanceOrder(
  bookingId: string,
): Promise<ApiResponse<BalanceOrderResult>> {
  const response = await apiClient.post<BalanceOrderResult>(
    `/bookings/${encodeURIComponent(bookingId)}/create-balance-order`,
    {},
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Could not initiate balance payment.' };
  }
  return { data: response.data, error: null };
}

/** Verifies Razorpay signature and marks the balance as paid. */
export async function verifyBalancePayment(params: {
  booking_id:          string;
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
}): Promise<ApiResponse<BalanceVerifyResult>> {
  const response = await apiClient.post<BalanceVerifyResult>(
    `/bookings/${encodeURIComponent(params.booking_id)}/verify-balance-payment`,
    {
      razorpay_order_id:   params.razorpay_order_id,
      razorpay_payment_id: params.razorpay_payment_id,
      razorpay_signature:  params.razorpay_signature,
    },
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Balance payment verification failed.' };
  }
  return { data: response.data, error: null };
}

export interface InvoiceDownloadResult {
  localUri: string; // expo-file-system local file path
  filename: string;
}

/**
 * Fetches the GST invoice PDF for a confirmed/completed booking as a Blob URL.
 * Returns the remote URL string to pass to expo-file-system for download.
 */
export function getInvoiceUrl(bookingId: string): string {
  // Returns the raw backend URL — download is handled by expo-file-system
  // not through apiClient because we need a binary stream, not JSON.
  const base = Config.apiBaseUrl.replace(/\/$/, '');
  return `${base}/bookings/${encodeURIComponent(bookingId)}/invoice`;
}
