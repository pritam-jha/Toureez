import { AppError, ERROR_MESSAGES } from '../constants/errors';
// FIXED: 4 - Public location reads use the clearly named anon client.
import { supabasePublic, supabaseAdmin } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { Location } from '../types';
import type { CreateLocationInput } from '../utils/vendorValidation';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const readString = (record: Record<string, unknown>, key: string, fallback = ''): string => {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
};

const readNullableNumber = (record: Record<string, unknown>, key: string): number | null => {
  const value = record[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const readBoolean = (record: Record<string, unknown>, key: string): boolean => {
  const value = record[key];
  return typeof value === 'boolean' ? value : false;
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  logger.error({ err: dbError, op: `locationService.${operation}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const mapLocation = (value: unknown): Location => {
  const record = isRecord(value) ? value : {};

  return {
    id: readString(record, 'id'),
    city: readString(record, 'city'),
    state: readString(record, 'state'),
    region: readString(record, 'region'),
    country: readString(record, 'country', 'India'),
    latitude: readNullableNumber(record, 'latitude'),
    longitude: readNullableNumber(record, 'longitude'),
    is_popular: readBoolean(record, 'is_popular'),
    is_active: readBoolean(record, 'is_active'),
    created_at: readString(record, 'created_at'),
  };
};

/**
 * Fetches active locations, optionally restricted to popular destinations.
 */
export const getLocations = async (popular?: boolean): Promise<Location[]> => {
  let query = supabasePublic
    .from('locations')
    .select('id, city, state, region, country, latitude, longitude, is_popular, is_active, created_at')
    .eq('is_active', true);

  if (popular === true) {
    query = query.eq('is_popular', true);
  }

  const { data, error } = await query
    .order('is_popular', { ascending: false })
    .order('state', { ascending: true })
    .order('city', { ascending: true });

  if (error !== null) {
    throwDatabaseError('getLocations', error);
  }

  return ((data as unknown[] | null) ?? []).map(mapLocation);
};

/**
 * Creates a vendor-submitted destination that isn't yet in the saved locations list.
 * If a location with the same city/state/country already exists, returns it instead
 * of erroring, since the vendor's intent is just "make sure this destination is selectable".
 */
export const createLocation = async (input: CreateLocationInput): Promise<Location> => {
  const { data, error } = await supabaseAdmin
    .from('locations')
    .insert({
      city: input.city,
      state: input.state,
      region: input.region,
      country: 'India',
      is_popular: false,
      is_active: true,
    })
    .select('id, city, state, region, country, latitude, longitude, is_popular, is_active, created_at')
    .single();

  if (error !== null) {
    if (error.code === '23505') {
      const { data: existing, error: fetchError } = await supabasePublic
        .from('locations')
        .select('id, city, state, region, country, latitude, longitude, is_popular, is_active, created_at')
        .eq('city', input.city)
        .eq('state', input.state)
        .eq('country', 'India')
        .maybeSingle();

      if (fetchError === null && existing !== null) {
        return mapLocation(existing);
      }
    }

    throwDatabaseError('createLocation', error);
  }

  return mapLocation(data);
};
