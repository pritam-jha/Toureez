import { apiClient } from './client';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
  [key: string]: unknown;
}

export async function getNotifications(basePath = '/notifications') {
  return apiClient.get<AppNotification[]>(basePath, undefined, true);
}

export async function markNotificationRead(id: string, basePath = '/notifications') {
  return apiClient.patch<{ updated: boolean }>(`${basePath}/${id}/read`);
}

export async function markAllNotificationsRead(basePath = '/notifications') {
  return apiClient.patch<{ updated: boolean }>(`${basePath}/read-all`);
}
