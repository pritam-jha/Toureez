/**
 * @file constants/config.ts
 * @description App-wide configuration constants for the Vendor Portal.
 * All magic numbers, limits, and environment-driven values live here.
 * Components and hooks import from this file — never use raw literals.
 */

import Constants from 'expo-constants';

// ── Environment variables (validated at startup) ─────────────────────────────

const env = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  EXPO_PUBLIC_CLOUDINARY_PRESET: process.env.EXPO_PUBLIC_CLOUDINARY_PRESET,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
} as const;

/**
 * Reads a required environment variable.
 * Throws at startup if the variable is missing, preventing silent failures
 * in production builds.
 */
function requireEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}. ` +
        `Ensure it is set in your .env file and prefixed with EXPO_PUBLIC_.`,
    );
  }
  return value;
}

export const Config = {
  // ── Supabase ───────────────────────────────────────────────
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),

  // ── Cloudinary ─────────────────────────────────────────────
  cloudinaryCloudName: requireEnv('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME'),
  cloudinaryUploadPreset: requireEnv('EXPO_PUBLIC_CLOUDINARY_PRESET'),

  // ── Backend API ────────────────────────────────────────────
  apiBaseUrl: requireEnv('EXPO_PUBLIC_API_BASE_URL'),

  // ── App metadata ───────────────────────────────────────────
  appName: 'NEXTTRP Vendor',
  appVersion: Constants.expoConfig?.version ?? '1.0.0',

  // ── Pagination ─────────────────────────────────────────────
  /** Default number of packages to fetch per page */
  packagesPageSize: 20,
  /** Default number of bookings to fetch per page */
  bookingsPageSize: 20,

  // ── Image upload ───────────────────────────────────────────
  /** Maximum image file size allowed for upload (5 MB) */
  maxImageSizeBytes: 5 * 1024 * 1024,
  /** Maximum number of images per package gallery */
  maxPackageImages: 10,
  /** Accepted image MIME types */
  acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,

  // ── TanStack Query ─────────────────────────────────────────
  /** How long fetched data is considered fresh (5 minutes) */
  queryStaleTimeMs: 5 * 60 * 1000,
  /** How long inactive query data stays in cache (10 minutes) */
  queryCacheTimeMs: 10 * 60 * 1000,

  // ── Package lifecycle ──────────────────────────────────────
  /** Minimum completeness fields required before submission */
  packageSubmitRequiredFields: [
    'location_id',
    'category_id',
    'description',
    'duration_days',
  ] as const,

  // ── Indian states list ─────────────────────────────────────
  indianStates: [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
  ] as const,
} as const;
