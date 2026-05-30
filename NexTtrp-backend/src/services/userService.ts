import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../utils/logger';
// FIXED: 2 - Use the shared vendor role constant instead of hardcoding the role value.
import { VENDOR_ROLE, type User, type UserRole } from '../types';
import type { UpdateProfileInput } from '../utils/validation';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const toRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const readString = (record: Record<string, unknown>, key: string, fallback = ''): string => {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
};

const readNullableString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' ? value : null;
};

const readRole = (record: Record<string, unknown>): UserRole => {
  const role = readString(record, 'role');
  // FIXED: 2 - Keep DB logic aligned with the company_owner enum value.
  return role === VENDOR_ROLE || role === 'admin' ? role : 'traveler';
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  logger.error({ err: dbError, op: `userService.${operation}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const mapUser = (value: unknown): User => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    full_name: readNullableString(record, 'full_name'),
    avatar_url: readNullableString(record, 'avatar_url'),
    phone: readNullableString(record, 'phone'),
    city: readNullableString(record, 'city'),
    state: readNullableString(record, 'state'),
    role: readRole(record),
    created_at: readString(record, 'created_at'),
    updated_at: readString(record, 'updated_at'),
  };
};

/**
 * Fetches a public user profile by Supabase auth user id.
 */
export const getProfile = async (userId: string): Promise<User> => {
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle();

  if (error !== null) {
    throwDatabaseError('getProfile', error);
  }

  if (data === null) {
    throw new AppError('User not found', 404);
  }

  return mapUser(data);
};

/**
 * Partially updates a public user profile and returns the persisted row.
 */
export const updateProfile = async (userId: string, data: UpdateProfileInput): Promise<User> => {
  const updates: Record<string, string> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates[key] = value;
    }
  });

  if (Object.keys(updates).length === 0) {
    return getProfile(userId);
  }

  updates.updated_at = new Date().toISOString();

  const { data: updatedUser, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error !== null) {
    throwDatabaseError('updateProfile', error);
  }

  if (updatedUser === null) {
    throw new AppError('User not found', 404);
  }

  return mapUser(updatedUser);
};

/**
 * Permanently deletes the user's account:
 *  1. Soft-cancel any pending/confirmed bookings they have
 *  2. Remove the public.users profile row
 *  3. Delete the auth.users entry via the Supabase Admin API
 *
 * This is irreversible. All personal data is removed per GDPR/DPDP Act.
 */
export const deleteAccount = async (userId: string): Promise<void> => {
  // Cancel any open bookings before deletion so vendors are notified
  const { error: cancelErr } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('status', ['pending', 'confirmed']);

  if (cancelErr !== null) {
    throwDatabaseError('deleteAccount.cancelBookings', cancelErr);
  }

  // Remove public profile (cascade deletes wishlist, notifications, reviews etc.)
  const { error: profileErr } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', userId);

  if (profileErr !== null) {
    throwDatabaseError('deleteAccount.deleteProfile', profileErr);
  }

  // Delete the Supabase auth user
  const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authErr !== null) {
    throwDatabaseError('deleteAccount.deleteAuthUser', authErr);
  }
};
