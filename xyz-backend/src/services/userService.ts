import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabase } from '../lib/supabase';
import type { User, UserRole } from '../types';
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
  return role === 'company_owner' || role === 'admin' ? role : 'traveler';
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  console.error(`[userService.${operation}]`, dbError);
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
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

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

  const { data: updatedUser, error } = await supabase
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
