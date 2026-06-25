/**
 * @file hooks/useVendorBookings.ts
 * @description Handles vendor booking queries and status update mutations.
 *
 * Provides:
 *  - useVendorBookings()          — paginated list with active filters
 *  - useVendorBooking(id)         — single booking detail
 *  - useUpdateBookingStatus()     — confirm or cancel a booking
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { listBookings, getBooking, updateBookingStatus } from '../lib/api/vendor';
import { useAuthStore } from '../store/authStore';
import { useVendorStore } from '../store/vendorStore';
import { VENDOR_ROLE } from '../types';
import type { VendorBookingListItem, VendorBookingDetail, PaginatedResponse } from '../types';
import { Config } from '../constants/config';
import { vendorDashboardQueryKeys } from './useVendorDashboard';

// ── Query keys ────────────────────────────────────────────────────────────────

export const vendorBookingQueryKeys = {
  all: ['vendor', 'bookings'] as const,
  list: (filters: Record<string, unknown>) => ['vendor', 'bookings', 'list', filters] as const,
  detail: (id: string) => ['vendor', 'bookings', 'detail', id] as const,
} as const;

// ── Booking list ──────────────────────────────────────────────────────────────

/**
 * Returns the paginated list of bookings for the vendor's company.
 * Applies active filters from the vendorStore.
 */
export function useVendorBookings(page = 1): UseQueryResult<PaginatedResponse<VendorBookingListItem>, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);
  const filters = useVendorStore((s) => s.bookingFilters);

  return useQuery({
    queryKey: vendorBookingQueryKeys.list({ ...filters, page }),
    queryFn: async () => {
      const { data, error } = await listBookings({
        ...filters,
        page,
        limit: Config.bookingsPageSize,
      });
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load bookings');
      return data;
    },
    enabled: isVendor,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

// ── Booking detail ────────────────────────────────────────────────────────────

/**
 * Returns full booking detail including traveler info and payment summary.
 */
export function useVendorBooking(bookingId: string): UseQueryResult<VendorBookingDetail, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorBookingQueryKeys.detail(bookingId),
    queryFn: async () => {
      const { data, error } = await getBooking(bookingId);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load booking');
      return data;
    },
    enabled: isVendor && bookingId !== '',
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

// ── Update status mutation ────────────────────────────────────────────────────

interface UpdateStatusVars {
  bookingId: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  note?: string;
}

/**
 * Mutation to update a booking's status (confirm, cancel, or mark completed).
 * Invalidates booking list and dashboard on success.
 */
export function useUpdateBookingStatus(): UseMutationResult<VendorBookingDetail, Error, UpdateStatusVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status, note }) => {
      const { data, error } = await updateBookingStatus(bookingId, status, note);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to update booking status');
      return data;
    },
    onSuccess: (booking) => {
      // Update detail cache
      queryClient.setQueryData(vendorBookingQueryKeys.detail(booking.id), booking);
      // Invalidate list and dashboard
      void queryClient.invalidateQueries({ queryKey: vendorBookingQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: vendorDashboardQueryKeys.all });
    },
  });
}
