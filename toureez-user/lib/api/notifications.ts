/**
 * @file lib/api/notifications.ts
 * @description Backend API calls for the authenticated notifications inbox.
 *
 * GET   /api/v1/notifications          — list the user's notifications
 * PATCH /api/v1/notifications/:id/read — mark one notification read
 * PATCH /api/v1/notifications/read-all — mark all notifications read
 */

import { apiClient } from './client';
import type { ApiResponse, AppNotification } from '../../types';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface MarkAllReadResult {
  updated_count: number;
}

// ── Functions ─────────────────────────────────────────────────────────────────

/**
 * Returns all notifications for the authenticated user, newest first.
 */
export async function getNotifications(): Promise<ApiResponse<AppNotification[]>> {
  const response = await apiClient.get<AppNotification[]>(
    '/notifications',
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to load notifications.' };
  }
  return { data: response.data, error: null };
}

/**
 * Marks a single notification as read. Returns the updated notification.
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<ApiResponse<AppNotification>> {
  const response = await apiClient.patch<AppNotification>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to mark notification as read.' };
  }
  return { data: response.data, error: null };
}

/**
 * Marks every unread notification for the user as read in a single call.
 */
export async function markAllNotificationsAsRead(): Promise<ApiResponse<MarkAllReadResult>> {
  const response = await apiClient.patch<MarkAllReadResult>(
    '/notifications/read-all',
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to mark notifications as read.' };
  }
  return { data: response.data, error: null };
}
