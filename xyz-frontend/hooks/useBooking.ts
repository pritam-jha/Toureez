/**
 * @file hooks/useBooking.ts
 * @description TanStack Query hooks for the complete booking flow.
 *
 * Covers:
 * - useCreateBooking   — POST /api/v1/bookings/create
 * - useConfirmMockPayment — POST /api/v1/bookings/confirm-mock
 * - useMyBookings      — GET  /api/v1/bookings
 * - useBookingDetail   — GET  /api/v1/bookings/:id
 * - usePriceCalculation — pure client-side reactive calculation
 */

import { useMemo } from 'react';
import { Alert } from 'react-native';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { router } from 'expo-router';

import { apiClient } from '../lib/api/client';
import { Config } from '../constants/config';
import type {
  Booking,
  BookingSummary,
  CreateBookingInput,
  PriceCalculation,
} from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

/** GST rate applied to travel packages in India */
const GST_RATE = 0.05;

/** Group discount rate applied when num_travelers >= 7 */
const GROUP_DISCOUNT_RATE = 0.05;

/** Group discount threshold */
const GROUP_DISCOUNT_THRESHOLD = 7;

/** Advance payment fraction (30%) */
const ADVANCE_FRACTION = 0.3;

// ── Query key factory ─────────────────────────────────────────────────────────

export const bookingQueryKeys = {
  all: ['bookings'] as const,
  list: () => ['bookings', 'list'] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
} as const;

// ── Price calculation ─────────────────────────────────────────────────────────

/**
 * Pure client-side price calculation hook.
 * Mirrors the backend calculation exactly so the UI is always consistent
 * with what the server will compute.
 *
 * @param pricingTier - Any object with base_price and discounted_price (or null).
 * @param numTravelers - Number of travelers (>= 1).
 * @param paymentType - 'full' or 'advance'.
 * @returns PriceCalculation object, or null if pricingTier is not provided.
 *
 * @example
 * const calc = usePriceCalculation(selectedTier, 3, 'full');
 * // calc.total_amount → ₹X
 */
export function usePriceCalculation(
  pricingTier: { base_price: number; discounted_price: number | null } | null | undefined,
  numTravelers: number,
  paymentType: 'full' | 'advance'
): PriceCalculation | null {
  return useMemo(() => {
    if (!pricingTier) return null;

    const travelers = Math.max(1, Math.round(numTravelers));
    const basePrice =
      pricingTier.discounted_price ?? pricingTier.base_price;

    const subtotal = basePrice * travelers;

    // 5% group discount for 7+ travelers
    const groupDiscount =
      travelers >= GROUP_DISCOUNT_THRESHOLD
        ? Math.round(subtotal * GROUP_DISCOUNT_RATE)
        : 0;

    const discountedSubtotal = subtotal - groupDiscount;
    const gst = Math.round(discountedSubtotal * GST_RATE);
    const totalAmount = discountedSubtotal + gst;

    const advanceAmount =
      paymentType === 'advance'
        ? Math.round(totalAmount * ADVANCE_FRACTION)
        : totalAmount;

    const balanceAmount =
      paymentType === 'advance' ? totalAmount - advanceAmount : 0;

    return {
      base_price: basePrice,
      num_travelers: travelers,
      subtotal,
      group_discount: groupDiscount,
      gst,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      balance_amount: balanceAmount,
      payment_type: paymentType,
    };
  }, [pricingTier, numTravelers, paymentType]);
}

// ── Create booking ────────────────────────────────────────────────────────────

interface CreateBookingResult {
  booking: Booking;
  price_calculation: PriceCalculation;
}

/**
 * Mutation hook for creating a new booking.
 * On success, navigates to the summary screen with the booking data.
 *
 * @example
 * const { mutate, isPending } = useCreateBooking();
 * mutate(input);
 */
export function useCreateBooking(): UseMutationResult<
  CreateBookingResult,
  Error,
  CreateBookingInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      console.log('[useCreateBooking] payload:', JSON.stringify(input, null, 2));

      const response = await apiClient.post<CreateBookingResult>(
        '/bookings/create',
        input,
        true
      );

      console.log('[useCreateBooking] response:', JSON.stringify(response, null, 2));

      if (response.error || !response.data) {
        throw new Error(response.error ?? 'Failed to create booking.');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate the bookings list so it refetches on next visit
      void queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.list(),
      });

      // Navigate to payment screen with the real booking ID
      router.push({
        pathname: '/booking/payment' as never,
        params: { bookingId: data.booking.id },
      });
    },
    onError: (err) => {
      // Surface the error — without this, failures are completely silent
      console.error('[useCreateBooking]', err.message);
      Alert.alert(
        'Booking Failed',
        err.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });
}

// ── Confirm mock payment ──────────────────────────────────────────────────────

interface ConfirmMockPaymentInput {
  booking_id: string;
  payment_type: 'full' | 'advance';
}

interface ConfirmMockPaymentResult {
  booking: Booking;
}

/**
 * Mutation hook for confirming a mock payment.
 * On success, navigates to the confirmation screen.
 *
 * NOTE: Replace the mutationFn body with Razorpay verification when integrating.
 *
 * @example
 * const { mutate, isPending } = useConfirmMockPayment();
 * mutate({ booking_id, payment_type: 'full' });
 */
export function useConfirmMockPayment(): UseMutationResult<
  ConfirmMockPaymentResult,
  Error,
  ConfirmMockPaymentInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfirmMockPaymentInput) => {
      const response = await apiClient.post<ConfirmMockPaymentResult>(
        '/bookings/confirm-mock',
        input,
        true
      );

      if (response.error || !response.data) {
        throw new Error(response.error ?? 'Payment confirmation failed.');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate both list and detail caches
      void queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.detail(data.booking.id),
      });

      // Navigate to confirmation screen
      router.replace({
        pathname: '/booking/confirmation' as never,
        params: { bookingId: data.booking.id },
      });
    },
  });
}

// ── My bookings list ──────────────────────────────────────────────────────────

/**
 * Query hook for fetching the authenticated user's booking history.
 *
 * @example
 * const { data, isLoading } = useMyBookings();
 */
export function useMyBookings(): UseQueryResult<BookingSummary[], Error> {
  return useQuery({
    queryKey: bookingQueryKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<BookingSummary[]>(
        '/bookings',
        undefined,
        true
      );

      if (response.error || !response.data) {
        throw new Error(response.error ?? 'Failed to load bookings.');
      }

      return response.data;
    },
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

// ── Booking detail ────────────────────────────────────────────────────────────

/**
 * Query hook for fetching a single booking by ID.
 * Disabled when id is empty.
 *
 * @param id - Booking UUID.
 *
 * @example
 * const { data, isLoading } = useBookingDetail(bookingId);
 */
export function useBookingDetail(
  id: string
): UseQueryResult<Booking, Error> {
  return useQuery({
    queryKey: bookingQueryKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Booking>(
        `/bookings/${encodeURIComponent(id)}`,
        undefined,
        true
      );

      if (response.error || !response.data) {
        throw new Error(response.error ?? 'Booking not found.');
      }

      return response.data;
    },
    enabled: Boolean(id && id.trim().length > 0),
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: (failureCount, err) => {
      if (
        err.message.includes('not found') ||
        err.message.includes('404')
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
