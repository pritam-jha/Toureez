import { AppError, ERROR_MESSAGES } from '../constants/errors';
// FIXED: 4 - Public category reads use the clearly named anon client.
import { supabasePublic } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { Category } from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const readString = (record: Record<string, unknown>, key: string, fallback = ''): string => {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
};

const readNullableString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' ? value : null;
};

const readNumber = (record: Record<string, unknown>, key: string): number => {
  const value = record[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const readBoolean = (record: Record<string, unknown>, key: string): boolean => {
  const value = record[key];
  return typeof value === 'boolean' ? value : false;
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  logger.error({ err: dbError, op: `categoryService.${operation}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const mapCategory = (value: unknown): Category => {
  const record = isRecord(value) ? value : {};

  return {
    id: readString(record, 'id'),
    name: readString(record, 'name'),
    label: readString(record, 'label'),
    icon: readString(record, 'icon'),
    description: readNullableString(record, 'description'),
    is_active: readBoolean(record, 'is_active'),
    display_order: readNumber(record, 'display_order'),
    created_at: readString(record, 'created_at'),
  };
};

/**
 * Fetches active categories ordered for display in the mobile app.
 */
export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabasePublic
    .from('categories')
    .select('id, name, label, icon, description, is_active, display_order, created_at')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error !== null) {
    throwDatabaseError('getCategories', error);
  }

  return ((data as unknown[] | null) ?? []).map(mapCategory);
};
