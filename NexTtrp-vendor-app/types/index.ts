/**
 * @file types/index.ts
 * @description Central type definitions for the NEXTTRP Vendor Portal.
 *
 * All interfaces are defined here and imported across the codebase to
 * ensure a single source of truth for data shapes.
 *
 * Mirrors the shared domain types from NexTtrp-user/types/index.ts
 * with vendor-specific extensions.
 */

import type { Session } from '@supabase/supabase-js';

// ── Auth types ────────────────────────────────────────────────────────────────

/**
 * Role assigned to an application user.
 * The DB enum uses company_owner; "Vendor" is UI copy only.
 */
export type UserRole = 'traveler' | 'company_owner' | 'admin';

// FIXED: 2 - The DB enum uses company_owner; reserve "Vendor" for UI labels.
export const VENDOR_ROLE = 'company_owner' as const;

/**
 * Public profile stored for a Supabase-authenticated user.
 */
export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  role: UserRole;
  created_at: string;
}

// ── Store state types ─────────────────────────────────────────────────────────

/**
 * Shape of the Zustand auth store state and actions.
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (user: User | null, session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

// ── API response types ────────────────────────────────────────────────────────

/**
 * Standardised API response wrapper used by all lib/api/* functions.
 * Ensures consistent error handling across the app — callers always
 * check `error` before using `data`.
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Standard API response envelope from the Node.js backend.
 */
export interface BackendApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Standard pagination wrapper returned by list endpoints.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ── Company types ─────────────────────────────────────────────────────────────

/**
 * Vendor company profile as returned by GET /api/v1/vendor/company.
 */
export interface VendorCompany {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  about: string | null;
  gst_number: string | null;
  trade_license_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  total_packages: number;
  created_at: string;
  updated_at: string;
}

/**
 * Company document record after Cloudinary upload.
 */
export interface CompanyDocument {
  id: string;
  company_id: string;
  document_type: 'trade_license' | 'gst_certificate' | 'pan_card' | 'other';
  url: string;
  public_id: string;
  label: string | null;
  uploaded_at: string;
}

// ── Package types ─────────────────────────────────────────────────────────────

/**
 * Package lifecycle status.
 */
export type PackageStatus = 'draft' | 'pending' | 'active' | 'rejected';

/**
 * Compact package item as returned by the vendor package list endpoint.
 */
export interface VendorPackageListItem {
  id: string;
  company_id: string;
  location_id: string | null;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  duration_days: number;
  duration_nights: number;
  min_group_size: number;
  max_group_size: number;
  status: PackageStatus;
  is_featured: boolean;
  is_bestseller: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  location: { city: string; state: string } | null;
  category: { name: string; label: string; icon: string } | null;
  lowest_price: number | null;
}

/**
 * Full package detail returned by GET /api/v1/vendor/packages/:id.
 */
export interface VendorPackageDetail extends VendorPackageListItem {
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  amenities: string[];
  pricing: VendorPricingTier[];
  itinerary: VendorItineraryDay[];
  images: VendorPackageImage[];
  rejection_reason: string | null;
}

/**
 * Pricing tier for a vendor package.
 */
export interface VendorPricingTier {
  id: string;
  package_id: string;
  label: string;
  min_people: number;
  max_people: number;
  base_price: number;
  discounted_price: number | null;
  currency: string;
  season: 'all' | 'peak' | 'off-peak';
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

/**
 * Single itinerary day for a vendor package.
 */
export interface VendorItineraryDay {
  id: string;
  package_id: string;
  day_number: number;
  title: string;
  description: string | null;
  meals: string[];
  accommodation: string | null;
  activities: string[];
  transport: string | null;
}

/**
 * Package gallery image.
 */
export interface VendorPackageImage {
  id: string;
  package_id: string;
  url: string;
  public_id: string;
  alt_text: string | null;
  is_cover: boolean;
  display_order: number;
}

// ── Booking types ─────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

/**
 * Compact booking item as returned by the vendor booking list endpoint.
 */
export interface VendorBookingListItem {
  id: string;
  booking_reference: string;
  travel_date: string;
  num_travelers: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  package: { id: string; title: string; cover_image: string | null };
  user: { id: string; full_name: string | null; phone: string | null; email: string };
}

/**
 * Full booking detail returned by GET /api/v1/vendor/bookings/:id.
 */
export interface VendorBookingDetail extends VendorBookingListItem {
  pricing_id: string;
  traveler_details: TravelerDetail[];
  payment: {
    amount_paid: number;
    payment_method: string | null;
    paid_at: string | null;
    payment_type: 'full' | 'advance';
  } | null;
}

/**
 * Individual traveler details collected during booking.
 */
export interface TravelerDetail {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  id_type: 'aadhaar' | 'passport' | 'driving_license';
  id_number: string;
  is_primary: boolean;
}

// ── Review types ──────────────────────────────────────────────────────────────

/**
 * A review as returned by GET /api/v1/vendor/reviews.
 */
export interface VendorReview {
  id: string;
  booking_id: string;
  user_id: string;
  package_id: string;
  overall_rating: number;
  rating_guide: number | null;
  rating_hotel: number | null;
  rating_food: number | null;
  rating_transport: number | null;
  rating_value: number | null;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  is_published: boolean;
  created_at: string;
  user: { display_name: string; avatar_url: string | null };
  package: { title: string };
}

// ── Payout types ──────────────────────────────────────────────────────────────

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

/**
 * Payout disbursement record.
 */
export interface VendorPayout {
  id: string;
  company_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  period_start: string | null;
  period_end: string | null;
  processed_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Payout bank/UPI account record.
 */
export interface VendorPayoutAccount {
  id: string;
  company_id: string;
  account_holder_name: string;
  bank_name: string | null;
  account_number_last4: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ── Dashboard types ───────────────────────────────────────────────────────────

/**
 * Dashboard metrics aggregated from the vendor's packages, bookings, and reviews.
 */
export interface VendorDashboardMetrics {
  total_packages: number;
  active_packages: number;
  pending_packages: number;
  draft_packages: number;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  this_month_revenue: number;
  avg_rating: number;
  total_reviews: number;
  pending_payouts: number;
  recent_bookings: RecentBookingSummary[];
}

export interface RecentBookingSummary {
  id: string;
  booking_reference: string;
  travel_date: string;
  num_travelers: number;
  total_amount: number;
  status: string;
  package_title: string;
  created_at: string;
}

// ── Notification types ────────────────────────────────────────────────────────

/**
 * Notification as returned by GET /api/v1/vendor/notifications.
 */
export interface VendorNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
}

// ── Cloudinary types ──────────────────────────────────────────────────────────

/**
 * Result returned after a successful Cloudinary upload.
 */
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}
