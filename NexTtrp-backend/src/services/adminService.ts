/**
 * @file services/adminService.ts
 * @description All database operations for the admin portal.
 *
 * Covers:
 *  - Dashboard analytics
 *  - User management (list, detail, role update)
 *  - Vendor (company) management (list, detail, approve, reject, verify)
 *  - Package moderation (list, detail, approve, reject, feature, bestseller)
 *  - Booking management (list, detail, status update)
 *  - Review moderation (list, publish, unpublish, verify)
 *  - Category CRUD
 *  - Location CRUD
 *
 * All DB access uses supabaseAdmin (service role) so RLS is bypassed
 * intentionally. Auth/role guards are enforced at the route layer.
 */

import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../utils/logger';
import type {
  Category,
  Location,
  Package,
  PaginatedResponse,
  Review,
  User,
} from '../types';
import type {
  AdminCreateCategoryInput,
  AdminCreateLocationInput,
  AdminUpdateCategoryInput,
  AdminUpdateLocationInput,
} from '../utils/adminValidation';
import {
  isRecord,
  toRecord,
  readString,
  readNullableString,
  readNumber,
  readBoolean,
  readArray,
  throwDb,
} from '../utils/dbHelpers';

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapUser = (row: Record<string, unknown>): User => ({
  id: readString(row, 'id'),
  full_name: readNullableString(row, 'full_name'),
  avatar_url: readNullableString(row, 'avatar_url'),
  phone: readNullableString(row, 'phone'),
  city: readNullableString(row, 'city'),
  state: readNullableString(row, 'state'),
  role: readString(row, 'role', 'traveler') as User['role'],
  created_at: readString(row, 'created_at'),
  updated_at: readString(row, 'updated_at') || readString(row, 'created_at'),
});

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
  owner?: { full_name: string | null; email: string; phone: string | null };
}

const mapVendor = (row: Record<string, unknown>): AdminVendor => {
  const ownerRaw = toRecord(row['owner']);
  return {
    id: readString(row, 'id'),
    owner_id: readString(row, 'owner_id'),
    name: readString(row, 'name'),
    slug: readString(row, 'slug'),
    logo_url: readNullableString(row, 'logo_url'),
    cover_url: readNullableString(row, 'cover_url'),
    about: readNullableString(row, 'about'),
    gst_number: readNullableString(row, 'gst_number'),
    trade_license_url: readNullableString(row, 'trade_license_url'),
    status: readString(row, 'status', 'pending') as AdminVendor['status'],
    is_verified: readBoolean(row, 'is_verified'),
    avg_rating: readNumber(row, 'avg_rating'),
    total_reviews: readNumber(row, 'total_reviews'),
    total_packages: readNumber(row, 'total_packages'),
    created_at: readString(row, 'created_at'),
    ...(Object.keys(ownerRaw).length > 0
      ? {
          owner: {
            full_name: readNullableString(ownerRaw, 'full_name'),
            email: readString(ownerRaw, 'email'),
            phone: readNullableString(ownerRaw, 'phone'),
          },
        }
      : {}),
  };
};

const mapPackage = (row: Record<string, unknown>): Package => ({
  id: readString(row, 'id'),
  company_id: readString(row, 'company_id'),
  location_id: readString(row, 'location_id'),
  category_id: readString(row, 'category_id'),
  title: readString(row, 'title'),
  slug: readString(row, 'slug'),
  description: readNullableString(row, 'description'),
  highlights: readArray(row, 'highlights') as string[],
  duration_days: readNumber(row, 'duration_days'),
  duration_nights: readNumber(row, 'duration_nights'),
  min_group_size: readNumber(row, 'min_group_size', 1),
  max_group_size: readNumber(row, 'max_group_size', 20),
  inclusions: readArray(row, 'inclusions') as string[],
  exclusions: readArray(row, 'exclusions') as string[],
  amenities: readArray(row, 'amenities') as string[],
  status: readString(row, 'status', 'draft') as Package['status'],
  is_featured: readBoolean(row, 'is_featured'),
  is_bestseller: readBoolean(row, 'is_bestseller'),
  avg_rating: readNumber(row, 'avg_rating'),
  review_count: readNumber(row, 'review_count'),
  total_bookings: readNumber(row, 'total_bookings'),
  created_at: readString(row, 'created_at'),
  updated_at: readString(row, 'updated_at'),
});

const mapReview = (row: Record<string, unknown>): Review => {
  const userRaw = toRecord(row['user']);
  const fullName = readString(userRaw, 'full_name').trim();
  let displayName = 'Anonymous';
  if (fullName.length > 0) {
    const parts = fullName.split(' ').filter(Boolean);
    displayName =
      parts.length >= 2
        ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
        : (parts[0] ?? 'Anonymous');
  }
  return {
    id: readString(row, 'id'),
    booking_id: readString(row, 'booking_id'),
    user_id: readString(row, 'user_id'),
    package_id: readString(row, 'package_id'),
    rating_guide: row['rating_guide'] != null ? readNumber(row, 'rating_guide') : null,
    rating_hotel: row['rating_hotel'] != null ? readNumber(row, 'rating_hotel') : null,
    rating_food: row['rating_food'] != null ? readNumber(row, 'rating_food') : null,
    rating_transport: row['rating_transport'] != null ? readNumber(row, 'rating_transport') : null,
    rating_value: row['rating_value'] != null ? readNumber(row, 'rating_value') : null,
    overall_rating: readNumber(row, 'overall_rating'),
    title: readNullableString(row, 'title'),
    body: readNullableString(row, 'body'),
    is_verified: readBoolean(row, 'is_verified'),
    is_published: readBoolean(row, 'is_published'),
    images: (readArray(row, 'images') as unknown[])
      .filter(isRecord)
      .map((item) => ({
        url: readString(item, 'url'),
        public_id: readString(item, 'public_id'),
      }))
      .filter((item) => item.url.length > 0),
    created_at: readString(row, 'created_at'),
    user: { display_name: displayName, avatar_url: readNullableString(userRaw, 'avatar_url') },
  };
};

const mapCategory = (row: Record<string, unknown>): Category => ({
  id: readString(row, 'id'),
  name: readString(row, 'name'),
  label: readString(row, 'label'),
  icon: readString(row, 'icon'),
  description: readNullableString(row, 'description'),
  is_active: readBoolean(row, 'is_active', true),
  display_order: readNumber(row, 'display_order'),
  created_at: readString(row, 'created_at'),
});

const mapLocation = (row: Record<string, unknown>): Location => ({
  id: readString(row, 'id'),
  city: readString(row, 'city'),
  state: readString(row, 'state'),
  region: readString(row, 'region'),
  country: readString(row, 'country', 'India'),
  latitude: row['latitude'] != null ? readNumber(row, 'latitude') : null,
  longitude: row['longitude'] != null ? readNumber(row, 'longitude') : null,
  is_popular: readBoolean(row, 'is_popular'),
  is_active: readBoolean(row, 'is_active', true),
  created_at: readString(row, 'created_at'),
});

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

// ── Dashboard helpers ─────────────────────────────────────────────────────────

/**
 * Detects the PostgREST "function not found" error (PGRST202).
 * This happens when get_admin_dashboard() hasn't been deployed to Supabase yet.
 */
function isRpcNotFound(err: unknown): boolean {
  if (!isRecord(err)) return false;
  const code = String(err['code'] ?? '');
  const msg  = String(err['message'] ?? '').toLowerCase();
  return (
    code === 'PGRST202' ||
    msg.includes('could not find the function') ||
    msg.includes('function') && msg.includes('does not exist')
  );
}

/**
 * Fallback: 11 parallel COUNT queries + 2 PostgREST aggregate selects.
 * Used automatically when get_admin_dashboard() RPC is not yet deployed.
 *
 * To enable the optimised single-query path, run:
 *   NexTtrp-backend/supabase/get_admin_dashboard.sql  in the Supabase SQL Editor.
 */
async function getDashboardFallback(): Promise<AdminDashboardMetrics> {
  logger.warn(
    'get_admin_dashboard RPC not found — falling back to parallel queries. ' +
    'Deploy NexTtrp-backend/supabase/get_admin_dashboard.sql to Supabase to enable the optimised path.',
  );

  const ms = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // ── Count queries (head:true → no row data, just count) ───────────────────
  const [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', ms),
    supabaseAdmin.from('companies').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('packages').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('packages').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('packages').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', ms),
    supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }).eq('is_published', false),
    supabaseAdmin.from('vendor_payouts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const cnt = (r: { count: number | null }): number => r.count ?? 0;

  // ── Revenue aggregates (PostgREST column alias syntax: total:col.sum()) ────
  // Filter to status='paid' only — excludes failed, refunded, and mock payments.
  const [revAll, revMonth] = await Promise.all([
    supabaseAdmin.from('payments').select('total:amount.sum()').eq('status', 'paid').maybeSingle(),
    supabaseAdmin.from('payments').select('total:amount.sum()').eq('status', 'paid').gte('created_at', ms).maybeSingle(),
  ]);

  const sumOf = (r: { data: unknown }): number => {
    if (!isRecord(r.data)) return 0;
    const v = r.data['total'];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') return Number.parseFloat(v) || 0;
    return 0;
  };

  return {
    total_users:            cnt(c0),
    new_users_this_month:   cnt(c1),
    total_vendors:          cnt(c2),
    pending_vendors:        cnt(c3),
    total_packages:         cnt(c4),
    pending_packages:       cnt(c5),
    active_packages:        cnt(c6),
    total_bookings:         cnt(c7),
    bookings_this_month:    cnt(c8),
    pending_reviews:        cnt(c9),
    pending_payouts:        cnt(c10),
    total_revenue:          sumOf(revAll),
    revenue_this_month:     sumOf(revMonth),
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getAdminDashboard(): Promise<AdminDashboardMetrics> {
  // Fast path: single DB round-trip via PL/pgSQL RPC.
  // SQL: NexTtrp-backend/supabase/get_admin_dashboard.sql (run once in Supabase SQL Editor).
  const { data, error } = await supabaseAdmin.rpc('get_admin_dashboard');

  if (error !== null) {
    // If the function hasn't been deployed yet, degrade gracefully.
    if (isRpcNotFound(error)) return getDashboardFallback();
    throwDb('getAdminDashboard', error);
  }

  // RPC returns one jsonb object; parse each field defensively.
  const row = isRecord(data) ? (data as Record<string, unknown>) : {};

  const num = (key: string): number => {
    const v = row[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const p = Number.parseFloat(v);
      return Number.isFinite(p) ? p : 0;
    }
    return 0;
  };

  return {
    total_users:            num('total_users'),
    new_users_this_month:   num('new_users_this_month'),
    total_vendors:          num('total_vendors'),
    pending_vendors:        num('pending_vendors'),
    total_packages:         num('total_packages'),
    pending_packages:       num('pending_packages'),
    active_packages:        num('active_packages'),
    total_bookings:         num('total_bookings'),
    bookings_this_month:    num('bookings_this_month'),
    total_revenue:          num('total_revenue'),
    revenue_this_month:     num('revenue_this_month'),
    pending_reviews:        num('pending_reviews'),
    pending_payouts:        num('pending_payouts'),
  };
}

// ── User management ───────────────────────────────────────────────────────────

export async function listUsers(params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}): Promise<PaginatedResponse<User>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.role) query = query.eq('role', params.role);
  if (params.search) {
    // Escape ILIKE special characters to prevent logical injection
    const escaped = params.search.replace(/[%_\\]/g, '\\$&');
    query = query.or(
      `full_name.ilike.%${escaped}%,phone.ilike.%${escaped}%,email.ilike.%${escaped}%`,
    );
  }

  const { data, error, count } = await query;
  if (error !== null) throwDb('listUsers', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapUser(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function getUserById(userId: string): Promise<User & { email: string; booking_count: number }> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error !== null) throwDb('getUserById', error);
  if (data === null) throw new AppError('User not found', 404);

  // Fetch email from auth.users and booking count
  const [authRes, bookingRes] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  const row = toRecord(data);
  return {
    ...mapUser(row),
    email: authRes.data.user?.email ?? '',
    booking_count: bookingRes.count ?? 0,
  };
}

export async function updateUserRole(
  userId: string,
  role: 'traveler' | 'company_owner' | 'admin',
): Promise<User> {
  // Guard: prevent demoting the last admin out of the admin role
  if (role !== 'admin') {
    const { data: currentUser, error: lookupErr } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (lookupErr !== null) throwDb('updateUserRole.lookup', lookupErr);

    if (currentUser !== null && (currentUser as Record<string, unknown>)['role'] === 'admin') {
      const { count, error: countErr } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (countErr !== null) throwDb('updateUserRole.countAdmins', countErr);

      if ((count ?? 0) <= 1) {
        throw new AppError('Cannot remove the last admin from the system', 409);
      }
    }
  }

  // .maybeSingle() returns null (not an error) when 0 rows are matched,
  // making the data === null check reachable and correct.
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error !== null) throwDb('updateUserRole', error);
  if (data === null) throw new AppError('User not found', 404);
  return mapUser(toRecord(data));
}

// ── Vendor management ─────────────────────────────────────────────────────────

export async function listVendors(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  isVerified?: boolean;
}): Promise<PaginatedResponse<AdminVendor>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  // No cross-schema join — select companies only, then fetch owners separately.
  // The companies.owner_id FK may reference auth.users which PostgREST cannot
  // join to public.users, causing "something went wrong" errors.
  let query = supabaseAdmin
    .from('companies')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq('status', params.status);
  if (params.isVerified !== undefined) query = query.eq('is_verified', params.isVerified);
  if (params.search) {
    const escaped = params.search.replace(/[%_\\]/g, '\\$&');
    query = query.ilike('name', `%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error !== null) throwDb('listVendors', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;

  // Fetch owner profiles separately via public.users
  const ownerIds = rows
    .map((r) => readString(toRecord(r), 'owner_id'))
    .filter((id) => id !== '');
  const ownerMap = await fetchUserMap(ownerIds);

  return {
    items: rows.map((r) => {
      const record = toRecord(r);
      const ownerId = readString(record, 'owner_id');
      const ownerProfile = ownerMap.get(ownerId);
      return mapVendor({ ...record, owner: ownerProfile ?? undefined });
    }),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function getVendorById(vendorId: string): Promise<AdminVendor> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', vendorId)
    .maybeSingle();

  if (error !== null) throwDb('getVendorById', error);
  if (data === null) throw new AppError('Vendor not found', 404);

  const record = toRecord(data);
  const ownerId = readString(record, 'owner_id');
  const ownerMap = await fetchUserMap(ownerId ? [ownerId] : []);
  return mapVendor({ ...record, owner: ownerMap.get(ownerId) ?? undefined });
}

export async function getCompanyOwnerId(companyId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('companies')
    .select('owner_id')
    .eq('id', companyId)
    .maybeSingle();
  const owner_id = toRecord(data ?? {});
  return readString(owner_id, 'owner_id') || null;
}

export async function approveVendor(vendorId: string): Promise<AdminVendor> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', vendorId)
    .select('*')
    .maybeSingle();

  if (error !== null) throwDb('approveVendor', error);
  if (data === null) throw new AppError('Vendor not found', 404);
  return getVendorById(vendorId);
}

export async function rejectVendor(vendorId: string, reason: string): Promise<AdminVendor> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', vendorId)
    .select('*')
    .maybeSingle();

  if (error !== null) throwDb('rejectVendor', error);
  if (data === null) throw new AppError('Vendor not found', 404);
  return getVendorById(vendorId);
}

export async function verifyVendor(vendorId: string): Promise<AdminVendor> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', vendorId)
    .select('*')
    .maybeSingle();

  if (error !== null) throwDb('verifyVendor', error);
  if (data === null) throw new AppError('Vendor not found', 404);
  return getVendorById(vendorId);
}

// ── Package moderation ────────────────────────────────────────────────────────

export interface AdminPackageListItem extends Package {
  cover_image: string | null;
  company: { id: string; name: string; logo_url: string | null };
  location: { id: string; city: string; state: string };
  category: { id: string; name: string; label: string; icon: string };
}

const mapAdminPackage = (row: Record<string, unknown>): AdminPackageListItem => {
  const companyRaw = toRecord(row['company']);
  const locationRaw = toRecord(row['location']);
  const categoryRaw = toRecord(row['category']);
  const imagesRaw = readArray(row, 'images') as Array<Record<string, unknown>>;
  const coverImg = imagesRaw.find((img) => readBoolean(img, 'is_cover'));

  return {
    ...mapPackage(row),
    cover_image: coverImg ? readString(coverImg, 'url') : null,
    company: {
      id: readString(companyRaw, 'id'),
      name: readString(companyRaw, 'name'),
      logo_url: readNullableString(companyRaw, 'logo_url'),
    },
    location: {
      id: readString(locationRaw, 'id'),
      city: readString(locationRaw, 'city'),
      state: readString(locationRaw, 'state'),
    },
    category: {
      id: readString(categoryRaw, 'id'),
      name: readString(categoryRaw, 'name'),
      label: readString(categoryRaw, 'label'),
      icon: readString(categoryRaw, 'icon'),
    },
  };
};

export async function listPackages(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  companyId?: string;
  isFeatured?: boolean;
}): Promise<PaginatedResponse<AdminPackageListItem>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('packages')
    .select(
      `*,
       company:companies(id, name, logo_url),
       location:locations(id, city, state),
       category:categories(id, name, label, icon),
       images:package_images(url, is_cover)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq('status', params.status);
  if (params.companyId) query = query.eq('company_id', params.companyId);
  if (params.isFeatured !== undefined) query = query.eq('is_featured', params.isFeatured);
  if (params.search) {
    const escaped = params.search.replace(/[%_\\]/g, '\\$&');
    query = query.ilike('title', `%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error !== null) throwDb('listPackages', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapAdminPackage(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function getPackageById(packageId: string): Promise<AdminPackageListItem> {
  const { data, error } = await supabaseAdmin
    .from('packages')
    .select(`
      *,
      company:companies(id, name, logo_url),
      location:locations(id, city, state),
      category:categories(id, name, label, icon),
      images:package_images(url, is_cover, public_id, alt_text, display_order)
    `)
    .eq('id', packageId)
    .maybeSingle();

  if (error !== null) throwDb('getPackageById', error);
  if (data === null) throw new AppError('Package not found', 404);
  return mapAdminPackage(toRecord(data));
}

async function recordPackageStatusHistory(
  packageId: string,
  companyId: string,
  oldStatus: string | null,
  newStatus: string,
  changedBy: string,
  reason?: string,
): Promise<void> {
  // Actual schema uses from_status / to_status (not old_status / new_status)
  // and requires company_id (NOT NULL FK to companies).
  const { error } = await supabaseAdmin.from('package_status_history').insert({
    package_id: packageId,
    company_id: companyId,
    from_status: oldStatus,
    to_status: newStatus,
    changed_by: changedBy,
    reason: reason ?? null,
  });
  if (error !== null) {
    logger.error({ err: error, packageId }, 'Failed to record package status history');
  }
}

export async function approvePackage(
  packageId: string,
  adminId: string,
  note?: string,
): Promise<Package> {
  const existing = await getPackageById(packageId);

  const { data, error } = await supabaseAdmin
    .from('packages')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', packageId)
    .select()
    .single();

  if (error !== null) throwDb('approvePackage', error);
  if (data === null) throw new AppError('Package not found', 404);

  void recordPackageStatusHistory(packageId, existing.company_id, existing.status, 'active', adminId, note);
  return mapPackage(toRecord(data));
}

export async function rejectPackage(
  packageId: string,
  adminId: string,
  reason: string,
): Promise<Package> {
  const existing = await getPackageById(packageId);

  const { data, error } = await supabaseAdmin
    .from('packages')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', packageId)
    .select()
    .single();

  if (error !== null) throwDb('rejectPackage', error);
  if (data === null) throw new AppError('Package not found', 404);

  void recordPackageStatusHistory(packageId, existing.company_id, existing.status, 'rejected', adminId, reason);
  return mapPackage(toRecord(data));
}

export async function featurePackage(
  packageId: string,
  isFeatured: boolean,
  isBestseller?: boolean,
): Promise<Package> {
  const updatePayload: Record<string, unknown> = {
    is_featured: isFeatured,
    updated_at: new Date().toISOString(),
  };
  if (isBestseller !== undefined) updatePayload['is_bestseller'] = isBestseller;

  const { data, error } = await supabaseAdmin
    .from('packages')
    .update(updatePayload)
    .eq('id', packageId)
    .select()
    .maybeSingle();

  if (error !== null) throwDb('featurePackage', error);
  if (data === null) throw new AppError('Package not found', 404);
  return mapPackage(toRecord(data));
}

export async function setBestsellerPackage(packageId: string, isBestseller: boolean): Promise<Package> {
  const { data, error } = await supabaseAdmin
    .from('packages')
    .update({ is_bestseller: isBestseller, updated_at: new Date().toISOString() })
    .eq('id', packageId)
    .select()
    .single();

  if (error !== null) throwDb('setBestsellerPackage', error);
  if (data === null) throw new AppError('Package not found', 404);
  return mapPackage(toRecord(data));
}

// ── Booking helpers ───────────────────────────────────────────────────────────

/**
 * Batch-fetches { full_name, phone } from public.users by id.
 *
 * Note: email lives in auth.users (private schema), not public.users, so it is
 * intentionally omitted here. Use supabaseAdmin.auth.admin.getUserById() when
 * a specific user's email is needed (e.g. vendor detail screen).
 */
async function fetchUserMap(
  userIds: string[],
): Promise<Map<string, { full_name: string | null; email: string }>> {
  const map = new Map<string, { full_name: string | null; email: string }>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name, phone')
    .in('id', userIds);

  if (error !== null) {
    logger.warn({ err: error }, 'fetchUserMap: failed to load user profiles');
    return map;
  }

  (data as unknown[] | null)?.forEach((u) => {
    const ur = toRecord(u);
    const id = readString(ur, 'id');
    if (id) {
      map.set(id, {
        full_name: readNullableString(ur, 'full_name'),
        email: '',  // fetched separately via auth.admin.getUserById when needed
      });
    }
  });

  return map;
}

// ── Booking management ────────────────────────────────────────────────────────

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
  package?: { title: string; duration_days: number; location: { city: string; state: string } };
  company?: { name: string; logo_url: string | null };
}

const mapAdminBooking = (row: Record<string, unknown>): AdminBooking => {
  const userRaw = toRecord(row['user']);
  const pkgRaw = toRecord(row['package']);
  const companyRaw = toRecord(row['company']);
  const locationRaw = toRecord(pkgRaw['location']);

  return {
    id: readString(row, 'id'),
    user_id: readString(row, 'user_id'),
    package_id: readString(row, 'package_id'),
    company_id: readString(row, 'company_id'),
    booking_reference: readString(row, 'booking_reference'),
    travel_date: readString(row, 'travel_date'),
    num_travelers: readNumber(row, 'num_travelers'),
    total_amount: readNumber(row, 'total_amount'),
    advance_amount: readNumber(row, 'advance_amount'),
    balance_amount: readNumber(row, 'balance_amount'),
    status: readString(row, 'status', 'pending') as AdminBooking['status'],
    payment_status: readString(row, 'payment_status', 'pending') as AdminBooking['payment_status'],
    special_requests: readNullableString(row, 'special_requests'),
    created_at: readString(row, 'created_at'),
    updated_at: readString(row, 'updated_at'),
    ...(Object.keys(userRaw).length > 0
      ? { user: { full_name: readNullableString(userRaw, 'full_name'), email: readString(userRaw, 'email') } }
      : {}),
    ...(Object.keys(pkgRaw).length > 0
      ? {
          package: {
            title: readString(pkgRaw, 'title'),
            duration_days: readNumber(pkgRaw, 'duration_days'),
            location: { city: readString(locationRaw, 'city'), state: readString(locationRaw, 'state') },
          },
        }
      : {}),
    ...(Object.keys(companyRaw).length > 0
      ? { company: { name: readString(companyRaw, 'name'), logo_url: readNullableString(companyRaw, 'logo_url') } }
      : {}),
  };
};

export async function listBookings(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  companyId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<PaginatedResponse<AdminBooking>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  // NOTE: bookings.user_id → auth.users (cross-schema), so PostgREST cannot
  // resolve it as a join (PGRST200). User data is fetched separately below.
  let query = supabaseAdmin
    .from('bookings')
    .select(
      `*,
       package:packages!bookings_package_id_fkey(title, duration_days, location:locations(city, state)),
       company:companies!bookings_company_id_fkey(name, logo_url)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq('status', params.status);
  if (params.paymentStatus) query = query.eq('payment_status', params.paymentStatus);
  if (params.companyId) query = query.eq('company_id', params.companyId);
  if (params.fromDate) query = query.gte('travel_date', params.fromDate);
  if (params.toDate) query = query.lte('travel_date', params.toDate);
  if (params.search) {
    const escaped = params.search.replace(/[%_\\]/g, '\\$&');
    query = query.ilike('booking_reference', `%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error !== null) throwDb('listBookings', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;

  // Batch-fetch user profiles for all bookings in this page
  const userIds = [
    ...new Set(
      rows.map((r) => readString(toRecord(r), 'user_id')).filter(Boolean),
    ),
  ];
  const userMap = await fetchUserMap(userIds);

  return {
    items: rows.map((r) => {
      const record = toRecord(r);
      const userId = readString(record, 'user_id');
      return mapAdminBooking({ ...record, user: userMap.get(userId) });
    }),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function getBookingById(bookingId: string): Promise<AdminBooking> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      package:packages!bookings_package_id_fkey(title, duration_days, location:locations(city, state)),
      company:companies!bookings_company_id_fkey(name, logo_url)
    `)
    .eq('id', bookingId)
    .maybeSingle();

  if (error !== null) throwDb('getBookingById', error);
  if (data === null) throw new AppError('Booking not found', 404);

  const record = toRecord(data);
  const userId = readString(record, 'user_id');
  const userMap = await fetchUserMap(userId ? [userId] : []);

  return mapAdminBooking({ ...record, user: userMap.get(userId) });
}

export async function updateBookingStatus(
  bookingId: string,
  status: AdminBooking['status'],
  changedBy: string,
  note?: string,
): Promise<AdminBooking> {
  // Fetch current booking BEFORE the update so we have from_status and company_id.
  const existing = await getBookingById(bookingId);

  // ── Step 1: bare UPDATE, no FK joins in RETURNING ─────────────────────────
  // Keeping the RETURNING clause simple avoids PostgREST join errors on UPDATE.
  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (updateError !== null) throwDb('updateBookingStatus.update', updateError);

  // ── Step 2: record the status transition event (non-fatal) ────────────────
  const { error: evtErr } = await supabaseAdmin.from('booking_status_events').insert({
    booking_id: bookingId,
    company_id: existing.company_id,
    from_status: existing.status,
    to_status: status,
    changed_by: changedBy,
    reason: note ?? null,
  });
  if (evtErr !== null) {
    logger.error({ err: evtErr, bookingId }, 'Failed to record booking status event');
  }

  // ── Step 3: re-fetch with full joins now that the write has settled ────────
  return getBookingById(bookingId);
}

// ── Review moderation ─────────────────────────────────────────────────────────

async function fetchReviewWithUser(reviewId: string): Promise<Review> {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .maybeSingle();

  if (error !== null) throwDb('fetchReviewWithUser', error);
  if (data === null) throw new AppError('Review not found', 404);

  const record = toRecord(data);
  const userId = readString(record, 'user_id');
  const userMap = await fetchUserMap(userId ? [userId] : []);
  const userProfile = userMap.get(userId);

  return mapReview({
    ...record,
    user: userProfile
      ? { full_name: userProfile.full_name, avatar_url: null }
      : undefined,
  });
}

export async function listReviews(params: {
  page: number;
  limit: number;
  search?: string;
  isPublished?: boolean;
  isVerified?: boolean;
  packageId?: string;
  minRating?: number;
}): Promise<PaginatedResponse<Review>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  // No cross-schema join — select reviews only, then fetch users separately.
  let query = supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.isPublished !== undefined) query = query.eq('is_published', params.isPublished);
  if (params.isVerified !== undefined) query = query.eq('is_verified', params.isVerified);
  if (params.packageId) query = query.eq('package_id', params.packageId);
  if (params.minRating !== undefined) query = query.gte('overall_rating', params.minRating);
  if (params.search) {
    const escaped = params.search.replace(/[%_\\]/g, '\\$&');
    query = query.or(`body.ilike.%${escaped}%,title.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error !== null) throwDb('listReviews', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;

  const userIds = rows
    .map((r) => readString(toRecord(r), 'user_id'))
    .filter((id) => id !== '');
  const userMap = await fetchUserMap(userIds);

  return {
    items: rows.map((r) => {
      const record = toRecord(r);
      const userId = readString(record, 'user_id');
      const userProfile = userMap.get(userId);
      return mapReview({
        ...record,
        user: userProfile ? { full_name: userProfile.full_name, avatar_url: null } : undefined,
      });
    }),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function publishReview(reviewId: string): Promise<Review> {
  const { error } = await supabaseAdmin
    .from('reviews')
    .update({ is_published: true })
    .eq('id', reviewId);

  if (error !== null) throwDb('publishReview', error);
  return fetchReviewWithUser(reviewId);
}

export async function unpublishReview(reviewId: string): Promise<Review> {
  const { error } = await supabaseAdmin
    .from('reviews')
    .update({ is_published: false })
    .eq('id', reviewId);

  if (error !== null) throwDb('unpublishReview', error);
  return fetchReviewWithUser(reviewId);
}

export async function verifyReview(reviewId: string): Promise<Review> {
  const { error } = await supabaseAdmin
    .from('reviews')
    .update({ is_verified: true })
    .eq('id', reviewId);

  if (error !== null) throwDb('verifyReview', error);
  return fetchReviewWithUser(reviewId);
}

// ── Category CRUD ─────────────────────────────────────────────────────────────

export async function listAllCategories(params: {
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<Category>> {
  const MAX_LIMIT = 200;
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 100, MAX_LIMIT);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from('categories')
    .select('*', { count: 'exact' })
    .order('display_order', { ascending: true })
    .range(from, to);

  if (error !== null) throwDb('listAllCategories', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapCategory(toRecord(r))),
    total,
    page,
    limit,
    has_more: from + rows.length < total,
  };
}

export async function createCategory(input: AdminCreateCategoryInput): Promise<Category> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert(input)
    .select()
    .single();

  if (error !== null) {
    if (error.code === '23505') throw new AppError('Category name already exists', 409);
    throwDb('createCategory', error);
  }
  if (data === null) throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
  return mapCategory(toRecord(data));
}

export async function updateCategory(
  categoryId: string,
  input: AdminUpdateCategoryInput,
): Promise<Category> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({ ...input, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', categoryId)
    .select()
    .maybeSingle();

  if (error !== null) throwDb('updateCategory', error);
  if (data === null) throw new AppError('Category not found', 404);
  return mapCategory(toRecord(data));
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', categoryId);
  if (error !== null) {
    if (error.code === '23503') throw new AppError('Category is in use by packages — cannot delete', 409);
    throwDb('deleteCategory', error);
  }
}

// ── Location CRUD ─────────────────────────────────────────────────────────────

export async function listAllLocations(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<PaginatedResponse<Location>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('locations')
    .select('*', { count: 'exact' })
    .order('city', { ascending: true })
    .range(from, to);

  if (params.search) {
    const escaped = params.search.replace(/[%_\\]/g, '\\$&');
    query = query.or(`city.ilike.%${escaped}%,state.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error !== null) throwDb('listAllLocations', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapLocation(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function createLocation(input: AdminCreateLocationInput): Promise<Location> {
  const { data, error } = await supabaseAdmin
    .from('locations')
    .insert(input)
    .select()
    .single();

  if (error !== null) throwDb('createLocation', error);
  if (data === null) throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
  return mapLocation(toRecord(data));
}

export async function updateLocation(
  locationId: string,
  input: AdminUpdateLocationInput,
): Promise<Location> {
  const { data, error } = await supabaseAdmin
    .from('locations')
    .update({ ...input, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', locationId)
    .select()
    .maybeSingle();

  if (error !== null) throwDb('updateLocation', error);
  if (data === null) throw new AppError('Location not found', 404);
  return mapLocation(toRecord(data));
}

export async function deleteLocation(locationId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('locations').delete().eq('id', locationId);
  if (error !== null) {
    if (error.code === '23503') throw new AppError('Location is in use by packages — cannot delete', 409);
    throwDb('deleteLocation', error);
  }
}
