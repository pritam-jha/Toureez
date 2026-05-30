/**
 * @file hooks/useVendorNotifications.ts
 * @description Fetches vendor notifications and provides mark-read mutations.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api/vendor';
import { useAuthStore } from '../store/authStore';
import { VENDOR_ROLE } from '../types';
import type { VendorNotification, PaginatedResponse } from '../types';
import { Config } from '../constants/config';

export const vendorNotificationQueryKeys = {
  all: ['vendor', 'notifications'] as const,
  list: (page: number) => ['vendor', 'notifications', 'list', page] as const,
} as const;

/**
 * Returns paginated notifications for the vendor user.
 */
export function useVendorNotifications(page = 1): UseQueryResult<PaginatedResponse<VendorNotification>, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorNotificationQueryKeys.list(page),
    queryFn: async () => {
      const { data, error } = await listNotifications({ page, limit: 20 });
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load notifications');
      return data;
    },
    enabled: isVendor,
    staleTime: 60_000, // 1 minute — notifications go stale quickly
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

/**
 * Returns the count of unread notifications (only queries page 1).
 */
export function useUnreadNotificationCount(): number {
  const query = useVendorNotifications(1);
  if (query.data == null) return 0;
  return query.data.items.filter((n) => !n.is_read).length;
}

/**
 * Mutation to mark a single notification as read.
 */
export function useMarkNotificationRead(): UseMutationResult<{ marked_read: boolean }, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const { data, error } = await markNotificationRead(notificationId);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to mark notification read');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorNotificationQueryKeys.all });
    },
  });
}

/**
 * Mutation to mark all notifications as read.
 */
export function useMarkAllNotificationsRead(): UseMutationResult<{ marked_read: boolean }, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await markAllNotificationsRead();
      if (error !== null || data === null) throw new Error(error ?? 'Failed to mark all notifications read');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorNotificationQueryKeys.all });
    },
  });
}
