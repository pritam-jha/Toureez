/**
 * @file constants/config.ts
 * @description App-wide configuration constants.
 * All magic numbers, limits, and environment-driven values live here.
 * Components and hooks import from this file — never use raw literals.
 */

import Constants from 'expo-constants';

// ── Environment variables (validated at startup) ─────────────────────────────

/**
 * Reads a required environment variable.
 * Throws at startup if the variable is missing, preventing silent failures
 * in production builds.
 */
function requireEnv(key: string): string {
  // Expo managed workflow exposes EXPO_PUBLIC_* vars via process.env
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}. ` +
        `Ensure it is set in your .env file and prefixed with EXPO_PUBLIC_.`
    );
  }
  return value;
}

export const Config = {
  // ── Supabase ──────────────────────────────────────────────
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),

  // ── Cloudinary ────────────────────────────────────────────
  cloudinaryCloudName: requireEnv('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME'),
  cloudinaryUploadPreset: requireEnv('EXPO_PUBLIC_CLOUDINARY_PRESET'),

  // ── Backend API ───────────────────────────────────────────
  apiBaseUrl: requireEnv('EXPO_PUBLIC_API_BASE_URL'),

  // ── App metadata ──────────────────────────────────────────
  appName: 'XYZ',
  appVersion: Constants.expoConfig?.version ?? '1.0.0',

  // ── Pagination ────────────────────────────────────────────
  /** Default number of packages to fetch per page */
  packagesPageSize: 20,

  // ── Comparison tray ───────────────────────────────────────
  /**
   * Maximum packages allowed in the comparison tray.
   * Aliased as MAX_COMPARE_PACKAGES for spec compliance.
   */
  maxCompareItems: 4,
  /** Alias — use this name when referencing the spec */
  MAX_COMPARE_PACKAGES: 4,

  // ── Wishlist ──────────────────────────────────────────────
  /**
   * Maximum number of images shown per package on the wishlist card.
   * Full gallery is shown on the package detail screen.
   */
  MAX_WISHLIST_IMAGES: 3,

  // ── Image upload ──────────────────────────────────────────
  /** Maximum image file size allowed for upload (5 MB) */
  maxImageSizeBytes: 5 * 1024 * 1024,
  /** Accepted image MIME types */
  acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,

  // ── TanStack Query ────────────────────────────────────────
  /** How long fetched data is considered fresh (5 minutes) */
  queryStaleTimeMs: 5 * 60 * 1000,
  /** How long inactive query data stays in cache (10 minutes) */
  queryCacheTimeMs: 10 * 60 * 1000,

  // ── Indian states list ────────────────────────────────────
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

  // ── Package categories ────────────────────────────────────
  packageCategories: [
    { value: 'pilgrimage', label: 'Pilgrimage' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'leisure', label: 'Leisure' },
    { value: 'honeymoon', label: 'Honeymoon' },
    { value: 'family', label: 'Family' },
  ] as const,
} as const;
