/**
 * @file hooks/admin/useAdminNotifications.ts
 * @description Query and mutation hooks for the admin notifications inbox.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '../../lib/api/admin';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/config';
import type { AdminNotification, PaginatedResponse } from '../../types';

export const adminNotificationQueryKeys = {
  all: ['admin', 'notifications'] as const,
  list: (page: number) => ['admin', 'notifications', 'list', page] as const,
} as const;

/**
 * Returns paginated notifications for the admin user.
 */
export function useAdminNotifications(
  page = 1,
): UseQueryResult<PaginatedResponse<AdminNotification>, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return useQuery({
    queryKey: adminNotificationQueryKeys.list(page),
    queryFn: async () => {
      const { data, error } = await getAdminNotifications({ page, limit: 20 });
      if (error !== null || data === null) {
        throw new Error(error ?? 'Failed to load notifications');
      }
      return data;
    },
    enabled: isAdmin,
    staleTime: 60_000,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

/**
 * Derives the unread badge count from page 1 of admin notifications.
 */
export function useAdminUnreadCount(): number {
  const query = useAdminNotifications(1);
  if (query.data == null) return 0;
  return query.data.items.filter((n) => !n.is_read).length;
}

/**
 * Mutation to mark a single admin notification as read.
 */
export function useMarkAdminNotificationRead(): UseMutationResult<
  { marked_read: boolean },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await markAdminNotificationRead(notificationId);
      if (error !== null || data === null) {
        throw new Error(error ?? 'Failed to mark notification read');
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminNotificationQueryKeys.all });
    },
  });
}

/**
 * Mutation to mark all admin notifications as read.
 */
export function useMarkAllAdminNotificationsRead(): UseMutationResult<
  { marked_read: boolean },
  Error,
  void
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await markAllAdminNotificationsRead();
      if (error !== null || data === null) {
        throw new Error(error ?? 'Failed to mark all notifications read');
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminNotificationQueryKeys.all });
    },
  });
}
