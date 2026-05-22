/**
 * @file hooks/useNotifications.ts
 * @description Query and mutation hooks for the authenticated notifications inbox.
 */

import { useMemo } from 'react';
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
import { apiClient } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import type { AppNotification, NotificationSection } from '../types';

export const notificationsQueryKeys = {
  all: ['notifications'] as const,
} as const;

interface NotificationMutationContext {
  previousNotifications?: AppNotification[];
}

interface MarkAllReadResult {
  updated_count: number;
}

const SECTION_ORDER: NotificationSection['key'][] = [
  'today',
  'yesterday',
  'earlier',
];

const SECTION_TITLES: Record<
  NotificationSection['key'],
  NotificationSection['title']
> = {
  today: 'Today',
  yesterday: 'Yesterday',
  earlier: 'Earlier',
};

function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSectionKey(
  notification: AppNotification,
  todayKey: string,
  yesterdayKey: string
): NotificationSection['key'] {
  const createdAt = new Date(notification.created_at);

  if (Number.isNaN(createdAt.getTime())) {
    return 'earlier';
  }

  const createdKey = localDateKey(createdAt);

  if (createdKey === todayKey) {
    return 'today';
  }

  if (createdKey === yesterdayKey) {
    return 'yesterday';
  }

  return 'earlier';
}

function groupNotifications(
  notifications: AppNotification[]
): NotificationSection[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayKey = localDateKey(today);
  const yesterdayKey = localDateKey(yesterday);
  const groups: Record<NotificationSection['key'], AppNotification[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  notifications.forEach((notification) => {
    groups[getSectionKey(notification, todayKey, yesterdayKey)].push(
      notification
    );
  });

  return SECTION_ORDER.flatMap((key) => {
    if (groups[key].length === 0) {
      return [];
    }

    return [
      {
        key,
        title: SECTION_TITLES[key],
        notifications: groups[key],
      },
    ];
  });
}

async function fetchNotifications(): Promise<AppNotification[]> {
  const response = await apiClient.get<AppNotification[]>(
    '/notifications',
    undefined,
    true
  );

  if (response.error || !response.data) {
    throw new Error(response.error ?? 'Failed to load notifications.');
  }

  return response.data;
}

function markRead(
  notifications: AppNotification[] | undefined,
  notificationId: string
): AppNotification[] {
  return (notifications ?? []).map((notification) =>
    notification.id === notificationId
      ? {
          ...notification,
          is_read: true,
        }
      : notification
  );
}

function markEveryNotificationRead(
  notifications: AppNotification[] | undefined
): AppNotification[] {
  return (notifications ?? []).map((notification) =>
    notification.is_read
      ? notification
      : {
          ...notification,
          is_read: true,
        }
  );
}

/**
 * Loads the current user's notifications and groups them for the inbox UI.
 */
export function useNotifications(): UseQueryResult<
  NotificationSection[],
  Error
> {
  const isAuthenticated = useAuthStore((state) => state.user !== null);

  return useQuery<AppNotification[], Error, NotificationSection[]>({
    queryKey: notificationsQueryKeys.all,
    queryFn: fetchNotifications,
    select: groupNotifications,
    enabled: isAuthenticated,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

/**
 * Derives the badge count from the same notifications query used by the inbox.
 */
export function useUnreadCount(): number {
  const notificationsQuery = useNotifications();

  return useMemo(
    () =>
      (notificationsQuery.data ?? []).reduce(
        (count, section) =>
          count +
          section.notifications.filter((notification) => !notification.is_read)
            .length,
        0
      ),
    [notificationsQuery.data]
  );
}

/**
 * Marks one notification as read with immediate optimistic UI feedback.
 */
export function useMarkAsRead(): UseMutationResult<
  AppNotification,
  Error,
  string,
  NotificationMutationContext
> {
  const queryClient = useQueryClient();

  return useMutation<AppNotification, Error, string, NotificationMutationContext>({
    mutationFn: async (notificationId) => {
      const response = await apiClient.patch<AppNotification>(
        `/notifications/${encodeURIComponent(notificationId)}/read`,
        undefined,
        true
      );

      if (response.error || !response.data) {
        throw new Error(response.error ?? 'Failed to mark notification as read.');
      }

      return response.data;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: notificationsQueryKeys.all,
      });

      const previousNotifications =
        queryClient.getQueryData<AppNotification[]>(notificationsQueryKeys.all);

      queryClient.setQueryData<AppNotification[]>(
        notificationsQueryKeys.all,
        (current) => markRead(current, notificationId)
      );

      return { previousNotifications };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationsQueryKeys.all,
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.all,
      });
    },
  });
}

/**
 * Marks the entire inbox as read with a single optimistic cache update.
 */
export function useMarkAllRead(): UseMutationResult<
  MarkAllReadResult,
  Error,
  void,
  NotificationMutationContext
> {
  const queryClient = useQueryClient();

  return useMutation<MarkAllReadResult, Error, void, NotificationMutationContext>({
    mutationFn: async () => {
      const response = await apiClient.patch<MarkAllReadResult>(
        '/notifications/read-all',
        undefined,
        true
      );

      if (response.error || !response.data) {
        throw new Error(response.error ?? 'Failed to mark notifications as read.');
      }

      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationsQueryKeys.all,
      });

      const previousNotifications =
        queryClient.getQueryData<AppNotification[]>(notificationsQueryKeys.all);

      queryClient.setQueryData<AppNotification[]>(
        notificationsQueryKeys.all,
        markEveryNotificationRead
      );

      return { previousNotifications };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationsQueryKeys.all,
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.all,
      });
    },
  });
}
