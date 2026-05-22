import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabase } from '../lib/supabase';
import type {
  Notification,
  NotificationRelatedType,
  NotificationType,
} from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const readString = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];
  return typeof value === 'string' ? value : '';
};

const readNullableString = (
  record: Record<string, unknown>,
  key: string,
): string | null => {
  const value = record[key];
  return typeof value === 'string' ? value : null;
};

const readBoolean = (
  record: Record<string, unknown>,
  key: string,
): boolean => {
  return record[key] === true;
};

const readData = (record: Record<string, unknown>): Record<string, unknown> => {
  return isRecord(record['data']) ? record['data'] : {};
};

const readNotificationType = (value: unknown): NotificationType => {
  if (
    value === 'booking_confirmed' ||
    value === 'payment_received' ||
    value === 'review_received' ||
    value === 'package_approved' ||
    value === 'wishlist_price_drop'
  ) {
    return value;
  }

  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const readRelatedType = (value: unknown): NotificationRelatedType | null => {
  if (value === 'booking' || value === 'package' || value === 'review') {
    return value;
  }

  return null;
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  console.error(`[notificationService.${operation}]`, dbError);
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const mapNotification = (value: unknown): Notification => {
  if (!isRecord(value)) {
    throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
  }

  return {
    id: readString(value, 'id'),
    user_id: readString(value, 'user_id'),
    type: readNotificationType(value['type']),
    title: readString(value, 'title'),
    body: readString(value, 'body'),
    data: readData(value),
    related_id: readNullableString(value, 'related_id'),
    related_type: readRelatedType(value['related_type']),
    is_read: readBoolean(value, 'is_read'),
    created_at: readString(value, 'created_at'),
  };
};

/**
 * Inserts a notification from trusted backend workflows.
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown>,
  relatedId?: string,
  relatedType?: NotificationRelatedType,
): Promise<Notification> => {
  const { data: inserted, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body,
      data,
      related_id: relatedId ?? null,
      related_type: relatedType ?? null,
    })
    .select('*')
    .single();

  if (error !== null) {
    throwDatabaseError('createNotification', error);
  }

  return mapNotification(inserted);
};

/**
 * Returns the current user's complete notification inbox, newest first.
 */
export const getUserNotifications = async (
  userId: string,
): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error !== null) {
    throwDatabaseError('getUserNotifications', error);
  }

  return ((data as unknown[] | null) ?? []).map(mapNotification);
};

/**
 * Marks one notification as read after verifying ownership.
 */
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string,
): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error !== null) {
    throwDatabaseError('markNotificationAsRead', error);
  }

  if (data === null) {
    throw new AppError('Notification not found', 404);
  }

  return mapNotification(data);
};

/**
 * Marks every unread notification for the current user as read.
 */
export const markAllNotificationsAsRead = async (
  userId: string,
): Promise<{ updated_count: number }> => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select('id');

  if (error !== null) {
    throwDatabaseError('markAllNotificationsAsRead', error);
  }

  return {
    updated_count: ((data as unknown[] | null) ?? []).length,
  };
};

/**
 * Counts unread notifications for callers that need a lightweight badge value.
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error !== null) {
    throwDatabaseError('getUnreadCount', error);
  }

  return count ?? 0;
};
