import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabase } from '../lib/supabase';
import type { PackageListItem } from '../types';
import { getPackageListItemsByIds } from './packageService';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const readString = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];
  return typeof value === 'string' ? value : '';
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  console.error(`[wishlistService.${operation}]`, dbError);
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const ensureActivePackageExists = async (packageId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('packages')
    .select('id')
    .eq('id', packageId)
    .eq('status', 'active')
    .maybeSingle();

  if (error !== null) {
    throwDatabaseError('ensureActivePackageExists', error);
  }

  if (data === null) {
    throw new AppError('Package not found', 404);
  }
};

/**
 * Fetches the authenticated user's active wishlisted packages.
 */
export const getUserWishlist = async (userId: string): Promise<PackageListItem[]> => {
  const { data, error } = await supabase
    .from('wishlists')
    .select('package_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error !== null) {
    throwDatabaseError('getUserWishlist', error);
  }

  const packageIds = ((data as unknown[] | null) ?? [])
    .filter(isRecord)
    .map((row) => readString(row, 'package_id'))
    .filter((packageId) => packageId !== '');

  return getPackageListItemsByIds(packageIds, 'min');
};

/**
 * Toggles a package in the authenticated user's wishlist and returns the new state.
 */
export const toggleWishlist = async (
  userId: string,
  packageId: string,
): Promise<{ wishlisted: boolean; package_id: string }> => {
  const { data: existing, error: lookupError } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('package_id', packageId)
    .maybeSingle();

  if (lookupError !== null) {
    throwDatabaseError('toggleWishlist.lookup', lookupError);
  }

  if (existing !== null) {
    const { error: deleteError } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('package_id', packageId);

    if (deleteError !== null) {
      throwDatabaseError('toggleWishlist.delete', deleteError);
    }

    return {
      wishlisted: false,
      package_id: packageId,
    };
  }

  await ensureActivePackageExists(packageId);

  const { error: upsertError } = await supabase.from('wishlists').upsert(
    {
      user_id: userId,
      package_id: packageId,
    },
    {
      onConflict: 'user_id,package_id',
    },
  );

  if (upsertError !== null) {
    throwDatabaseError('toggleWishlist.upsert', upsertError);
  }

  return {
    wishlisted: true,
    package_id: packageId,
  };
};
