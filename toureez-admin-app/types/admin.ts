/**
 * @file types/admin.ts
 * @description Admin-specific type definitions for the Toureez admin portal.
 *
 * These extend the shared domain types from types/index.ts and are
 * scoped to admin-portal screens and hooks.
 */

import type { User } from './index';

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface AdminDashboardMetrics {
  total_users: number;
  new_users_this_month: number;
  total_vendors: number;
  pending_vendors: number;
  total_packages: number;
  pending_packages: number;
  active_packages: number;
  total_bookings: number;
  bookings_this_month: number;
  total_revenue: number;
  revenue_this_month: number;
  pending_reviews: number;
  pending_payouts: number;
}

// ── System health ─────────────────────────────────────────────────────────────

export interface SystemHealth {
  service: string;
  status: 'ok' | 'degraded';
  uptime_seconds: number;
  timestamp: string;
  checks: {
    database: 'ok' | 'error';
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface AdminUser extends User {
  email?: string;
  booking_count?: number;
  updated_at: string;
}

// ── Vendors ───────────────────────────────────────────────────────────────────

export interface AdminVendor {
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
  owner?: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
}

// ── Packages ──────────────────────────────────────────────────────────────────

export interface AdminPackageListItem {
  id: string;
  company_id: string;
  location_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string | null;
  highlights: string[];
  duration_days: number;
  duration_nights: number;
  min_group_size: number;
  max_group_size: number;
  inclusions: string[];
  exclusions: string[];
  amenities: string[];
  status: 'draft' | 'pending' | 'active' | 'rejected';
  is_featured: boolean;
  is_bestseller: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
  cover_image: string | null;
  company: { id: string; name: string; logo_url: string | null };
  location: { id: string; city: string; state: string };
  category: { id: string; name: string; label: string; icon: string };
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export interface AdminBooking {
  id: string;
  user_id: string;
  package_id: string;
  company_id: string;
  booking_reference: string;
  travel_date: string;
  num_travelers: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  user?: { full_name: string | null; email: string };
  package?: {
    title: string;
    duration_days: number;
    location: { city: string; state: string };
  };
  company?: { name: string; logo_url: string | null };
}

// ── Payouts ───────────────────────────────────────────────────────────────────

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface AdminPayout {
  id: string;
  company_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  period_start: string | null;
  period_end: string | null;
  /** Timestamp when payout was processed/paid (DB column: processed_at) */
  processed_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  company?: { name: string; logo_url: string | null };
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin?: {
    full_name: string | null;
    email: string;
  };
}

// ── Query param types ─────────────────────────────────────────────────────────

export interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminVendorListParams extends AdminListParams {
  status?: 'pending' | 'approved' | 'rejected';
  is_verified?: boolean;
}

export interface AdminPackageListParams extends AdminListParams {
  status?: 'draft' | 'pending' | 'active' | 'rejected';
  company_id?: string;
  is_featured?: boolean;
}

export interface AdminBookingListParams extends AdminListParams {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed';
  company_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface AdminReviewListParams extends AdminListParams {
  is_published?: boolean;
  is_verified?: boolean;
  package_id?: string;
  min_rating?: number;
}

export interface AdminPayoutListParams extends AdminListParams {
  status?: PayoutStatus;
  company_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface AdminAuditLogListParams extends AdminListParams {
  admin_id?: string;
  entity_type?: string;
  entity_id?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
}

// ── Moderation action types ───────────────────────────────────────────────────

export type VendorModerationAction = 'approve' | 'reject' | 'verify';
export type PackageModerationAction = 'approve' | 'reject' | 'feature' | 'unfeature' | 'bestseller';
export type ReviewModerationAction = 'publish' | 'unpublish' | 'verify';
export type BookingModerationAction = 'confirm' | 'cancel' | 'complete';
