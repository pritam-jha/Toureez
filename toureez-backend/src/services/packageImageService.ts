/**
 * @file services/packageImageService.ts
 * @description Vendor package-image management: save, set cover, delete.
 *
 * Upload flow
 * ──────────────────────────────────────────────────────────────────────────────
 * 1. The client (Expo app) picks a photo with expo-image-picker.
 * 2. The client uploads the file DIRECTLY to Cloudinary using an unsigned
 *    upload preset (EXPO_PUBLIC_CLOUDINARY_PRESET).
 * 3. Cloudinary returns { secure_url, public_id }.
 * 4. The client calls  POST /api/v1/packages/:id/images  with only the
 *    metadata — no binary data ever hits our server.
 * 5. This service verifies package ownership and saves the metadata row.
 *
 * When the vendor deletes an image this service also calls the Cloudinary API
 * to remove the asset from their account.
 */

import { cloudinary } from '../lib/cloudinary';
// FIXED: 4 - Vendor image writes use the explicitly named admin client.
import { supabaseAdmin } from '../lib/supabase';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { logger } from '../utils/logger';
import type { PackageImage } from '../types';
import type { PackageImageSaveInput } from '../utils/validation';

// ── Helpers ───────────────────────────────────────────────────────────────────

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  logger.error({ err: dbError, op: `packageImageService.${operation}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const readString = (record: Record<string, unknown>, key: string, fallback = ''): string => {
  const val = record[key];
  return typeof val === 'string' ? val : fallback;
};

const readNullableString = (record: Record<string, unknown>, key: string): string | null => {
  const val = record[key];
  return typeof val === 'string' ? val : null;
};

const readBoolean = (record: Record<string, unknown>, key: string, fallback = false): boolean => {
  const val = record[key];
  return typeof val === 'boolean' ? val : fallback;
};

const readNumber = (record: Record<string, unknown>, key: string, fallback = 0): number => {
  const val = record[key];
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = Number.parseFloat(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

function mapImage(value: unknown): PackageImage {
  const record = toRecord(value);
  return {
    id: readString(record, 'id'),
    package_id: readString(record, 'package_id'),
    url: readString(record, 'url'),
    public_id: readString(record, 'public_id'),
    alt_text: readNullableString(record, 'alt_text'),
    is_cover: readBoolean(record, 'is_cover'),
    display_order: readNumber(record, 'display_order'),
  };
}

// ── Ownership guard ───────────────────────────────────────────────────────────

/**
 * Throws 404 if the package doesn't exist, 403 if the authenticated user is
 * not the company owner that listed this package.
 */
async function assertPackageOwnership(
  packageId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('packages')
    .select('id, companies(owner_id)')
    .eq('id', packageId)
    .maybeSingle();

  if (error !== null) {
    throwDatabaseError('assertPackageOwnership', error);
  }

  if (data === null) {
    throw new AppError('Package not found', 404);
  }

  // Supabase embeds the related row; it may be an object or array of one
  const companyRaw = Array.isArray(data.companies)
    ? data.companies[0]
    : data.companies;
  const company = toRecord(companyRaw);

  if (readString(company, 'owner_id') !== userId) {
    throw new AppError('You are not authorized to manage images for this package', 403);
  }
}

/**
 * Same as assertPackageOwnership but additionally verifies the image row
 * belongs to that package (prevents cross-package image manipulation).
 */
async function assertImageOwnership(
  packageId: string,
  imageId: string,
  userId: string,
): Promise<void> {
  await assertPackageOwnership(packageId, userId);

  const { data, error } = await supabaseAdmin
    .from('package_images')
    .select('id')
    .eq('id', imageId)
    .eq('package_id', packageId)
    .maybeSingle();

  if (error !== null) {
    throwDatabaseError('assertImageOwnership', error);
  }

  if (data === null) {
    throw new AppError('Image not found', 404);
  }
}

// ── Public service functions ──────────────────────────────────────────────────

/**
 * Returns all images for a package, ordered by display_order.
 * Requires the caller to be the package owner.
 */
export const getPackageImages = async (
  packageId: string,
  userId: string,
): Promise<PackageImage[]> => {
  await assertPackageOwnership(packageId, userId);

  const { data, error } = await supabaseAdmin
    .from('package_images')
    .select('id, package_id, url, public_id, alt_text, is_cover, display_order')
    .eq('package_id', packageId)
    .order('display_order', { ascending: true });

  if (error !== null) {
    throwDatabaseError('getPackageImages', error);
  }

  return ((data as unknown[] | null) ?? []).map(mapImage);
};

/**
 * Saves Cloudinary image metadata to the package_images table.
 * The actual file upload happens on the client — this call only stores the URL
 * and public_id that Cloudinary returned to the client.
 */
export const savePackageImage = async (
  packageId: string,
  userId: string,
  input: PackageImageSaveInput,
): Promise<PackageImage> => {
  await assertPackageOwnership(packageId, userId);

  // Determine the next display_order
  const { data: maxOrderRow } = await supabaseAdmin
    .from('package_images')
    .select('display_order')
    .eq('package_id', packageId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder =
    maxOrderRow !== null &&
    typeof (maxOrderRow as Record<string, unknown>).display_order === 'number'
      ? (maxOrderRow as Record<string, unknown>).display_order as number + 1
      : 0;

  // If marking this as cover, clear any existing cover first
  if (input.is_cover) {
    const { error: clearError } = await supabaseAdmin
      .from('package_images')
      .update({ is_cover: false })
      .eq('package_id', packageId);

    if (clearError !== null) {
      throwDatabaseError('savePackageImage.clearCover', clearError);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('package_images')
    .insert({
      package_id: packageId,
      url: input.url,
      public_id: input.public_id,
      alt_text: input.alt_text ?? null,
      is_cover: input.is_cover ?? false,
      display_order: nextOrder,
    })
    .select('id, package_id, url, public_id, alt_text, is_cover, display_order')
    .single();

  if (error !== null) {
    throwDatabaseError('savePackageImage', error);
  }

  return mapImage(data);
};

/**
 * Promotes one image to be the cover, clearing is_cover on all other images
 * for the same package.
 */
export const setPackageCoverImage = async (
  packageId: string,
  imageId: string,
  userId: string,
): Promise<void> => {
  await assertImageOwnership(packageId, imageId, userId);

  // Clear all existing covers
  const { error: clearError } = await supabaseAdmin
    .from('package_images')
    .update({ is_cover: false })
    .eq('package_id', packageId);

  if (clearError !== null) {
    throwDatabaseError('setPackageCoverImage.clear', clearError);
  }

  // Set the new cover
  const { error: setError } = await supabaseAdmin
    .from('package_images')
    .update({ is_cover: true })
    .eq('id', imageId);

  if (setError !== null) {
    throwDatabaseError('setPackageCoverImage.set', setError);
  }
};

/**
 * Deletes an image from both Cloudinary and the package_images table.
 * If Cloudinary deletion fails (e.g. already removed) we still delete the DB
 * row so the UI stays consistent.
 */
export const deletePackageImage = async (
  packageId: string,
  imageId: string,
  userId: string,
): Promise<void> => {
  await assertImageOwnership(packageId, imageId, userId);

  // Fetch public_id so we can remove the asset from Cloudinary
  const { data: imageRow, error: fetchError } = await supabaseAdmin
    .from('package_images')
    .select('public_id')
    .eq('id', imageId)
    .single();

  if (fetchError !== null) {
    throwDatabaseError('deletePackageImage.fetch', fetchError);
  }

  const publicId = readString(toRecord(imageRow), 'public_id');

  // Best-effort Cloudinary deletion — log but don't fail if the asset is gone
  if (publicId) {
    try {
      await cloudinary().uploader.destroy(publicId);
    } catch (err) {
      logger.warn({ err }, 'deletePackageImage: Cloudinary delete failed (non-fatal)');
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from('package_images')
    .delete()
    .eq('id', imageId);

  if (deleteError !== null) {
    throwDatabaseError('deletePackageImage.delete', deleteError);
  }
};
