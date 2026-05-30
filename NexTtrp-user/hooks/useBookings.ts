/**
 * @file hooks/useBookings.ts
 * @description Query and mutation hooks for booking history and detail screens.
 */

import { useCallback, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';

import { Config } from '../constants/config';
import {
  getMyBookings,
  getBookingById,
  cancelBooking,
} from '../lib/api/bookings';
import type { CancelBookingResult } from '../lib/api/bookings';
import { useAuthStore } from '../store/authStore';
import { formatINR } from '../utils/currency';
import type { Booking, BookingSummary } from '../types';

export type MyBookingsFilter = 'upcoming' | 'completed' | 'cancelled';

export type { CancelBookingResult };

export interface CancelBookingToastState {
  message: string;
  visible: boolean;
}

export type UseCancelBookingReturn = UseMutationResult<
  CancelBookingResult,
  Error,
  string
> & {
  toast: CancelBookingToastState;
  hideToast: () => void;
};

export const bookingsQueryKeys = {
  all: ['bookings'] as const,
  list: (filter?: MyBookingsFilter) => ['bookings', filter] as const,
  detailRoot: ['booking'] as const,
  detail: (id: string) => ['booking', id] as const,
} as const;

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function bookingDateKey(date: string): string {
  return date.slice(0, 10);
}

function filterBookings(
  bookings: BookingSummary[],
  filter?: MyBookingsFilter
): BookingSummary[] {
  if (!filter) return bookings;

  if (filter === 'completed') {
    return bookings.filter((booking) => booking.status === 'completed');
  }

  if (filter === 'cancelled') {
    return bookings.filter((booking) => booking.status === 'cancelled');
  }

  const today = localDateKey(new Date());
  return bookings.filter(
    (booking) =>
      booking.status === 'confirmed' &&
      bookingDateKey(booking.travel_date) >= today
  );
}

async function fetchMyBookings(): Promise<BookingSummary[]> {
  const { data, error } = await getMyBookings();
  if (error || !data) throw new Error(error ?? 'Failed to load bookings.');
  return data;
}

/**
 * Loads bookings once per filter key and filters status/date on the client.
 */
export function useMyBookings(
  filter?: MyBookingsFilter
): UseQueryResult<BookingSummary[], Error> {
  const isAuthenticated = useAuthStore((state) => state.user !== null);

  return useQuery({
    queryKey: bookingsQueryKeys.list(filter),
    queryFn: async () => filterBookings(await fetchMyBookings(), filter),
    enabled: isAuthenticated,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

/**
 * Loads the full authenticated booking detail payload.
 */
export function useBookingDetail(
  id: string
): UseQueryResult<Booking, Error> {
  const isAuthenticated = useAuthStore((state) => state.user !== null);

  return useQuery({
    queryKey: bookingsQueryKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await getBookingById(id);
      if (error || !data) throw new Error(error ?? 'Booking not found.');
      return data;
    },
    enabled: isAuthenticated && id.trim().length > 0,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: (failureCount, error) => {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Cancels an eligible booking and exposes the success toast for the caller.
 */
export function useCancelBooking(): UseCancelBookingReturn {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<CancelBookingToastState>({
    message: '',
    visible: false,
  });

  const mutation = useMutation<CancelBookingResult, Error, string>({
    mutationFn: async (id) => {
      const { data, error } = await cancelBooking(id);
      if (error || !data) throw new Error(error ?? 'Failed to cancel booking.');
      return data;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        bookingsQueryKeys.detail(result.booking.id),
        result.booking
      );
      void queryClient.invalidateQueries({ queryKey: bookingsQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.detailRoot,
      });
      setToast({
        message: `Booking cancelled. ${formatINR(result.refund_amount)} refund in 5-7 days.`,
        visible: true,
      });
    },
  });

  const hideToast = useCallback(() => {
    setToast((current) => ({ ...current, visible: false }));
  }, []);

  return {
    ...mutation,
    toast,
    hideToast,
  };
}
