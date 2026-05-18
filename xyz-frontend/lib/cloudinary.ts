/**
 * @file lib/cloudinary.ts
 * @description Cloudinary upload utility using the unsigned upload preset.
 *
 * We use the REST upload API directly (via fetch) rather than the
 * cloudinary-react-native SDK's upload widget, because the SDK's widget
 * requires a native module setup that conflicts with Expo managed workflow.
 * The unsigned preset is safe for client-side uploads — Cloudinary's
 * upload preset restricts allowed transformations and folder destinations.
 */

import { Config } from '../constants/config';
import type { ApiResponse, CloudinaryUploadResult } from '../types';

/** Base URL for Cloudinary's unsigned upload endpoint */
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${Config.cloudinaryCloudName}/image/upload`;

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Extracts a human-readable message from an unknown error value.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred during upload.';
}

/**
 * Validates that a file URI is a local file path (not a remote URL).
 * Cloudinary upload expects a local file URI from the image picker.
 */
function isValidLocalUri(uri: string): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://')
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Uploads a local image file to Cloudinary using an unsigned upload preset.
 *
 * Accepts a local file URI (from expo-image-picker or expo-camera) and
 * uploads it to Cloudinary. Returns the public_id and secure_url needed
 * to store in the database and render the image.
 *
 * @param localUri - Local file URI from the device (file://, content://, ph://).
 * @param folder - Cloudinary folder to organise uploads (e.g. 'avatars', 'packages').
 * @returns Typed ApiResponse containing the Cloudinary upload result.
 *
 * @example
 * const { data, error } = await uploadImage(result.assets[0].uri, 'avatars');
 * if (error) { showToast(error); return; }
 * await updateProfile({ avatar_url: data.secure_url });
 */
export async function uploadImage(
  localUri: string,
  folder: string = 'xyz'
): Promise<ApiResponse<CloudinaryUploadResult>> {
  try {
    if (!localUri || localUri.trim().length === 0) {
      return { data: null, error: 'Image URI is required.' };
    }

    if (!isValidLocalUri(localUri)) {
      return {
        data: null,
        error: 'Invalid image URI. Expected a local file path.',
      };
    }

    // Determine the file extension from the URI
    const uriParts = localUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1]?.toLowerCase() ?? 'jpg';

    // Map extension to MIME type
    const mimeTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      heic: 'image/heic',
      heif: 'image/heif',
    };

    const mimeType = mimeTypeMap[fileExtension] ?? 'image/jpeg';

    // Build multipart form data for the upload
    const formData = new FormData();

    // React Native's FormData accepts { uri, name, type } objects for files.
    // The `as unknown as Blob` cast is required because RN's FormData type
    // differs from the browser's Blob-based FormData — this is unavoidable.
    formData.append('file', {
      uri: localUri,
      name: `upload.${fileExtension}`,
      type: mimeType,
    } as unknown as Blob);

    formData.append('upload_preset', Config.cloudinaryUploadPreset);
    formData.append('folder', folder);

    // Enforce max 800×800 output via Cloudinary's incoming transformation.
    // This runs server-side so the stored asset is already resized — no need
    // to resize on-device before upload. The unsigned preset must allow
    // incoming_transformation for this to take effect.
    formData.append(
      'transformation',
      'c_limit,w_800,h_800,f_auto,q_auto'
    );

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        // Do NOT set Content-Type manually — fetch sets it automatically
        // with the correct multipart boundary when body is FormData.
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        data: null,
        error: `Cloudinary upload failed (${response.status}): ${errorBody}`,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await response.json();

    if (result.error) {
      return {
        data: null,
        error: `Cloudinary error: ${result.error.message}`,
      };
    }

    const uploadResult: CloudinaryUploadResult = {
      public_id: result.public_id,
      secure_url: result.secure_url,
      original_filename: result.original_filename,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };

    return { data: uploadResult, error: null };
  } catch (err) {
    return {
      data: null,
      error: `uploadImage: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Generates a Cloudinary transformation URL for an existing image.
 * Use this to generate thumbnails, resized versions, or cropped images
 * without storing multiple copies.
 *
 * @param publicId - The Cloudinary public_id of the image.
 * @param width - Desired output width in pixels.
 * @param height - Desired output height in pixels.
 * @param crop - Cloudinary crop mode (default: 'fill').
 * @returns The transformed image URL as a string.
 *
 * @example
 * const thumbUrl = getTransformedUrl(image.public_id, 400, 300);
 */
export function getTransformedUrl(
  publicId: string,
  width: number,
  height: number,
  crop: 'fill' | 'fit' | 'crop' | 'thumb' = 'fill'
): string {
  return `https://res.cloudinary.com/${Config.cloudinaryCloudName}/image/upload/c_${crop},w_${width},h_${height},f_auto,q_auto/${publicId}`;
}

/**
 * Generates a Cloudinary URL with automatic format and quality optimisation.
 * Use for full-size image display where dimensions are not constrained.
 *
 * @param publicId - The Cloudinary public_id of the image.
 * @returns The optimised image URL as a string.
 */
export function getOptimisedUrl(publicId: string): string {
  return `https://res.cloudinary.com/${Config.cloudinaryCloudName}/image/upload/f_auto,q_auto/${publicId}`;
}
