/**
 * @file services/vendorService.ts
 * @description Database operations for the vendor portal.
 *
 * Covers:
 *  - Vendor profile retrieval (GET /vendor/me)
 *  - Dashboard metrics aggregation (GET /vendor/dashboard)
 *  - Company profile CRUD (GET/POST/PATCH /vendor/company)
 *  - Company document uploads (POST /vendor/company/documents)
 *  - Vendor notifications (GET /vendor/notifications)
 *  - Vendor reviews (GET /vendor/reviews)
 *  - Vendor payout operations (GET /vendor/payouts, POST /vendor/payout-accounts)
 *
 * All DB access uses supabaseAdmin (service role) so RLS is bypassed intentionally.
 * Auth/role guards are enforced at the route layer via requireAuth + requireRole.
 * Every public function scopes queries to the authenticated vendor's company_id,
 * preventing cross-vendor data access.
 */

import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabaseAdmin } from '../lib/supabase';
import {
  isRecord,
  toRecord,
  readString,
  readNullableString,
  readNumber,
  readBoolean,
  throwDb,
} from '../utils/dbHelpers';
import type { PaginatedResponse, User } from '../types';
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
  UploadCompanyDocumentInput,
  CreatePayoutAccountInput,
  VendorListNotificationsQuery,
} from '../utils/vendorValidation';
import type { VendorPayoutAccount, VendorPayout } from './payoutService';

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface CompanyDocument {
  id: string;
  company_id: string;
  document_type: string;
  url: string;
  public_id: string;
  label: string | null;
  uploaded_at: string;
}

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

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapCompany = (row: Record<string, unknown>): VendorCompany => ({
  id: readString(row, 'id'),
  owner_id: readString(row, 'owner_id'),
  name: readString(row, 'name'),
  slug: readString(row, 'slug'),
  logo_url: readNullableString(row, 'logo_url'),
  cover_url: readNullableString(row, 'cover_url'),
  about: readNullableString(row, 'about'),
  gst_number: readNullableString(row, 'gst_number'),
  trade_license_url: readNullableString(row, 'trade_license_url'),
  status: readString(row, 'status', 'pending') as VendorCompany['status'],
  is_verified: readBoolean(row, 'is_verified'),
  avg_rating: readNumber(row, 'avg_rating'),
  total_reviews: readNumber(row, 'total_reviews'),
  total_packages: readNumber(row, 'total_packages'),
  created_at: readString(row, 'created_at'),
  updated_at: readString(row, 'updated_at'),
});

const mapDocument = (row: Record<string, unknown>): CompanyDocument => ({
  id: readString(row, 'id'),
  company_id: readString(row, 'company_id'),
  document_type: readString(row, 'document_type'),
  url: readString(row, 'file_url'),
  public_id: readString(row, 'public_id'),
  label: readNullableString(row, 'label'),
  uploaded_at: readString(row, 'uploaded_at') || readString(row, 'created_at'),
});

const mapReview = (row: Record<string, unknown>): VendorReview => {
  const userRaw = toRecord(row['user']);
  const pkgRaw = toRecord(row['package']);
  return {
    id: readString(row, 'id'),
    booking_id: readString(row, 'booking_id'),
    user_id: readString(row, 'user_id'),
    package_id: readString(row, 'package_id'),
    overall_rating: readNumber(row, 'overall_rating'),
    rating_guide: isRecord(row) && 'rating_guide' in row ? (typeof row['rating_guide'] === 'number' ? row['rating_guide'] : null) : null,
    rating_hotel: typeof row['rating_hotel'] === 'number' ? row['rating_hotel'] : null,
    rating_food: typeof row['rating_food'] === 'number' ? row['rating_food'] : null,
    rating_transport: typeof row['rating_transport'] === 'number' ? row['rating_transport'] : null,
    rating_value: typeof row['rating_value'] === 'number' ? row['rating_value'] : null,
    title: readNullableString(row, 'title'),
    body: readNullableString(row, 'body'),
    is_verified: readBoolean(row, 'is_verified'),
    is_published: readBoolean(row, 'is_published'),
    created_at: readString(row, 'created_at'),
    user: {
      display_name: readString(userRaw, 'full_name', 'Traveler'),
      avatar_url: readNullableString(userRaw, 'avatar_url'),
    },
    package: { title: readString(pkgRaw, 'title', 'Package') },
  };
};

const mapNotification = (row: Record<string, unknown>): VendorNotification => ({
  id: readString(row, 'id'),
  user_id: readString(row, 'user_id'),
  type: readString(row, 'type'),
  title: readString(row, 'title'),
  body: readString(row, 'body'),
  data: isRecord(row['data']) ? (row['data'] as Record<string, unknown>) : {},
  related_id: readNullableString(row, 'related_id'),
  related_type: readNullableString(row, 'related_type'),
  is_read: readBoolean(row, 'is_read'),
  created_at: readString(row, 'created_at'),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolves the company owned by the given user.
 * Returns null if no company exists (onboarding not yet complete).
 */
async function resolveCompanyId(ownerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error !== null) throwDb('resolveCompanyId', error);
  return (data as { id?: string } | null)?.id ?? null;
}

/**
 * Resolves the company owned by the given user.
 * Throws 404 if no company exists.
 */
async function requireCompanyId(ownerId: string): Promise<string> {
  const companyId = await resolveCompanyId(ownerId);
  if (companyId === null) {
    throw new AppError('Company profile not found. Please complete onboarding first.', 404);
  }
  return companyId;
}

// ── Vendor Profile ────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated vendor's user profile and company status summary.
 */
export async function getVendorProfile(userId: string): Promise<{
  user: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'phone' | 'city' | 'state' | 'role' | 'created_at'>;
  company: VendorCompany | null;
}> {
  const [userResult, companyResult] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle(),
    supabaseAdmin.from('companies').select('*').eq('owner_id', userId).maybeSingle(),
  ]);

  if (userResult.error !== null) throwDb('getVendorProfile.user', userResult.error);
  if (userResult.data === null) throw new AppError('User not found', 404);

  const userRow = toRecord(userResult.data);

  return {
    user: {
      id: readString(userRow, 'id'),
      full_name: readNullableString(userRow, 'full_name'),
      avatar_url: readNullableString(userRow, 'avatar_url'),
      phone: readNullableString(userRow, 'phone'),
      city: readNullableString(userRow, 'city'),
      state: readNullableString(userRow, 'state'),
      role: 'company_owner',
      created_at: readString(userRow, 'created_at'),
    },
    company: companyResult.data !== null ? mapCompany(toRecord(companyResult.data)) : null,
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

/**
 * Aggregates dashboard metrics for the authenticated vendor.
 * All counts are scoped to the vendor's company_id.
 */
export async function getVendorDashboard(ownerId: string): Promise<VendorDashboardMetrics> {
  const companyId = await requireCompanyId(ownerId);

  // Step 1: fetch packages (need IDs to scope reviews query, since reviews.company_id doesn't exist)
  const packagesResult = await supabaseAdmin
    .from('packages')
    .select('id, status', { count: 'exact', head: false })
    .eq('company_id', companyId);

  if (packagesResult.error !== null) throwDb('getVendorDashboard.packages', packagesResult.error);

  const packages = (packagesResult.data as unknown[] | null) ?? [];
  const packageIds = packages.map((p) => readString(toRecord(p), 'id')).filter(Boolean);

  // Step 2: run remaining queries concurrently
  // Reviews are joined through packages (reviews has no company_id — only package_id).
  // vendor_payouts table does not yet exist in schema; return 0 gracefully.
  const [bookingsResult, reviewsResult, recentBookingsResult] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .select('status, total_amount', { count: 'exact', head: false })
      .eq('company_id', companyId),

    packageIds.length > 0
      ? supabaseAdmin
          .from('reviews')
          .select('overall_rating', { count: 'exact', head: false })
          .in('package_id', packageIds)
          .eq('is_published', true)
      : Promise.resolve({ data: [] as unknown[], error: null, count: 0, status: 200, statusText: 'OK' }),

    supabaseAdmin
      .from('bookings')
      .select('id, booking_reference, travel_date, num_travelers, total_amount, status, created_at, packages!bookings_package_id_fkey(title)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (bookingsResult.error !== null) throwDb('getVendorDashboard.bookings', bookingsResult.error);
  if (reviewsResult.error !== null) throwDb('getVendorDashboard.reviews', reviewsResult.error);

  const bookings = (bookingsResult.data as unknown[] | null) ?? [];
  const reviews = (reviewsResult.data as unknown[] | null) ?? [];
  const pendingPayoutRows: unknown[] = []; // vendor_payouts table not yet in schema
  const recentRows = (recentBookingsResult.data as unknown[] | null) ?? [];

  // ── Package metrics ────────────────────────────────────────
  const packagesByStatus = packages.reduce<Record<string, number>>((acc, row) => {
    const r = toRecord(row);
    const status = readString(r, 'status', 'draft');
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  // ── Booking metrics ────────────────────────────────────────
  const bookingsByStatus = bookings.reduce<Record<string, number>>((acc, row) => {
    const r = toRecord(row);
    const status = readString(r, 'status', 'pending');
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const totalRevenue = bookings.reduce<number>((sum, row) => {
    const r = toRecord(row);
    const status = readString(r, 'status');
    return status === 'confirmed' || status === 'completed'
      ? sum + readNumber(r, 'total_amount')
      : sum;
  }, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthRevenue = bookings.reduce<number>((sum, row) => {
    const r = toRecord(row);
    const status = readString(r, 'status');
    const createdAt = readString(r, 'created_at');
    if ((status === 'confirmed' || status === 'completed') && createdAt >= monthStart) {
      return sum + readNumber(r, 'total_amount');
    }
    return sum;
  }, 0);

  // ── Review metrics ─────────────────────────────────────────
  const avgRating =
    reviews.length > 0
      ? reviews.reduce<number>((sum, row) => sum + readNumber(toRecord(row), 'overall_rating'), 0) / reviews.length
      : 0;

  const pendingPayouts = pendingPayoutRows.reduce<number>(
    (sum, row) => sum + readNumber(toRecord(row), 'amount'),
    0,
  );

  // ── Recent bookings ────────────────────────────────────────
  const recentBookings: RecentBookingSummary[] = recentRows.map((row) => {
    const r = toRecord(row);
    const pkgRaw = toRecord(r['packages']);
    return {
      id: readString(r, 'id'),
      booking_reference: readString(r, 'booking_reference'),
      travel_date: readString(r, 'travel_date'),
      num_travelers: readNumber(r, 'num_travelers'),
      total_amount: readNumber(r, 'total_amount'),
      status: readString(r, 'status'),
      package_title: readString(pkgRaw, 'title', 'Package'),
      created_at: readString(r, 'created_at'),
    };
  });

  return {
    total_packages: packages.length,
    active_packages: packagesByStatus['active'] ?? 0,
    pending_packages: packagesByStatus['pending'] ?? 0,
    draft_packages: packagesByStatus['draft'] ?? 0,
    total_bookings: bookings.length,
    confirmed_bookings: bookingsByStatus['confirmed'] ?? 0,
    pending_bookings: bookingsByStatus['pending'] ?? 0,
    cancelled_bookings: bookingsByStatus['cancelled'] ?? 0,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    this_month_revenue: Math.round(thisMonthRevenue * 100) / 100,
    avg_rating: Math.round(avgRating * 10) / 10,
    total_reviews: reviews.length,
    pending_payouts: Math.round(pendingPayouts * 100) / 100,
    recent_bookings: recentBookings,
  };
}

// ── Company ───────────────────────────────────────────────────────────────────

/**
 * Fetches the vendor's company profile.
 * Returns null if the vendor has not yet completed onboarding.
 */
export async function getVendorCompany(ownerId: string): Promise<VendorCompany | null> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error !== null) throwDb('getVendorCompany', error);
  return data !== null ? mapCompany(toRecord(data)) : null;
}

/**
 * Creates the vendor's company profile (first-time onboarding).
 * Throws 409 if the vendor already has a company.
 */
export async function createVendorCompany(ownerId: string, input: CreateCompanyInput): Promise<VendorCompany> {
  // Guard: one company per vendor
  const existing = await resolveCompanyId(ownerId);
  if (existing !== null) {
    throw new AppError('A company profile already exists for this account.', 409);
  }

  // Derive a URL-safe slug from the company name
  const slug = input.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);

  const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

  const payload: Record<string, unknown> = {
    owner_id: ownerId,
    name: input.name,
    slug: uniqueSlug,
    about: input.about ?? null,
    gst_number: input.gst_number ?? null,
    logo_url: input.logo_url ?? null,
    cover_url: input.cover_url ?? null,
    status: 'pending',
    is_verified: false,
    avg_rating: 0,
    total_reviews: 0,
    total_packages: 0,
  };

  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert(payload)
    .select('*')
    .single();

  if (error !== null) throwDb('createVendorCompany', error);
  if (data === null) throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
  return mapCompany(toRecord(data));
}

/**
 * Updates the vendor's existing company profile.
 * Only provided fields are updated; undefined fields are left unchanged.
 */
export async function updateVendorCompany(ownerId: string, input: UpdateCompanyInput): Promise<VendorCompany> {
  const companyId = await requireCompanyId(ownerId);

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates['name'] = input.name;
  if (input.about !== undefined) updates['about'] = input.about;
  if (input.gst_number !== undefined) updates['gst_number'] = input.gst_number;
  if (input.logo_url !== undefined) updates['logo_url'] = input.logo_url;
  if (input.cover_url !== undefined) updates['cover_url'] = input.cover_url;

  if (Object.keys(updates).length === 0) {
    // No-op — return current company
    const company = await getVendorCompany(ownerId);
    if (company === null) throw new AppError('Company not found', 404);
    return company;
  }

  updates['updated_at'] = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select('*')
    .single();

  if (error !== null) throwDb('updateVendorCompany', error);
  if (data === null) throw new AppError('Company not found', 404);
  return mapCompany(toRecord(data));
}

/**
 * Saves a company document record after the file has been uploaded to Cloudinary.
 * Documents are stored in the company_documents table.
 */
export async function saveCompanyDocument(
  ownerId: string,
  input: UploadCompanyDocumentInput,
): Promise<CompanyDocument> {
  const companyId = await requireCompanyId(ownerId);

  const payload = {
    company_id: companyId,
    uploaded_by: ownerId,
    document_type: input.document_type,
    file_url: input.url,
    public_id: input.public_id,
    label: input.label ?? null,
  };

  const { data, error } = await supabaseAdmin
    .from('company_documents')
    .insert(payload)
    .select('*')
    .single();

  if (error !== null) throwDb('saveCompanyDocument', error);
  if (data === null) throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
  return mapDocument(toRecord(data));
}

// ── Reviews ───────────────────────────────────────────────────────────────────

/**
 * Lists published reviews for the vendor's packages.
 * Scoped to the vendor's company_id via a packages join.
 */
export async function getVendorReviews(
  ownerId: string,
  params: { page: number; limit: number },
): Promise<PaginatedResponse<VendorReview>> {
  const companyId = await requireCompanyId(ownerId);
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  // reviews has no company_id — scope via the company's package IDs
  const pkgResult = await supabaseAdmin
    .from('packages')
    .select('id')
    .eq('company_id', companyId);

  if (pkgResult.error !== null) throwDb('getVendorReviews.packages', pkgResult.error);
  const packageIds = ((pkgResult.data as unknown[] | null) ?? [])
    .map((p) => readString(toRecord(p), 'id'))
    .filter(Boolean);

  if (packageIds.length === 0) {
    return { items: [], total: 0, page: params.page, limit: params.limit, has_more: false };
  }

  const { data, error, count } = await supabaseAdmin
    .from('reviews')
    .select(
      'id, booking_id, user_id, package_id, overall_rating, rating_guide, rating_hotel, rating_food, rating_transport, rating_value, title, body, is_verified, is_published, created_at, package:packages(title), user:users(full_name, avatar_url)',
      { count: 'exact' },
    )
    .in('package_id', packageIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error !== null) throwDb('getVendorReviews', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;

  return {
    items: rows.map((r) => mapReview(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

// ── Payouts ───────────────────────────────────────────────────────────────────

/**
 * Lists payout disbursements for the vendor's company.
 */
export async function getVendorPayouts(
  ownerId: string,
  params: { page: number; limit: number },
): Promise<PaginatedResponse<VendorPayout>> {
  const _companyId = await requireCompanyId(ownerId);
  const from = (params.page - 1) * params.limit;
  const _to = from + params.limit - 1;

  // vendor_payouts table is not yet in the schema — return empty gracefully.
  const rows: unknown[] = [];
  const total = 0;

  const isRecord2 = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);
  const toRec = (v: unknown): Record<string, unknown> =>
    isRecord2(v) ? v : {};

  return {
    items: rows.map((r) => {
      const rec = toRec(r);
      return {
        id: readString(rec, 'id'),
        company_id: readString(rec, 'company_id'),
        amount: readNumber(rec, 'amount'),
        currency: readString(rec, 'currency', 'INR'),
        status: readString(rec, 'status', 'pending') as VendorPayout['status'],
        period_start: readNullableString(rec, 'period_start'),
        period_end: readNullableString(rec, 'period_end'),
        processed_at: readNullableString(rec, 'processed_at'),
        failure_reason: readNullableString(rec, 'failure_reason'),
        metadata: isRecord2(rec['metadata']) ? (rec['metadata'] as Record<string, unknown>) : {},
        created_at: readString(rec, 'created_at'),
        updated_at: readString(rec, 'updated_at'),
      } as VendorPayout;
    }),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

/**
 * Saves a payout account for the vendor's company.
 */
export async function createPayoutAccount(
  ownerId: string,
  input: CreatePayoutAccountInput,
): Promise<VendorPayoutAccount> {
  const companyId = await requireCompanyId(ownerId);

  // If marking as primary, demote any existing primary account first
  if (input.is_primary) {
    await supabaseAdmin
      .from('vendor_payout_accounts')
      .update({ is_primary: false })
      .eq('company_id', companyId)
      .eq('is_primary', true);
  }

  const last4 =
    input.account_number !== undefined && input.account_number.length >= 4
      ? input.account_number.slice(-4)
      : null;

  const _payload: Record<string, unknown> = {
    company_id: companyId,
    account_holder_name: input.account_holder_name,
    bank_name: input.bank_name ?? null,
    account_number_last4: last4,
    ifsc_code: input.ifsc_code ?? null,
    upi_id: input.upi_id ?? null,
    is_primary: input.is_primary ?? false,
    is_verified: false,
  };

  // vendor_payout_accounts table is not yet in the schema.
  throw new AppError('Payout accounts are not yet available. Please check back later.', 503);
}

/**
 * Lists payout accounts for the vendor's company.
 */
export async function getPayoutAccounts(ownerId: string): Promise<VendorPayoutAccount[]> {
  const _companyId = await requireCompanyId(ownerId);

  // vendor_payout_accounts table is not yet in the schema — return empty gracefully.
  const rows: unknown[] = [];
  return rows.map((r) => {
    const rec = toRecord(r);
    return {
      id: readString(rec, 'id'),
      company_id: readString(rec, 'company_id'),
      account_holder_name: readString(rec, 'account_holder_name'),
      bank_name: readNullableString(rec, 'bank_name'),
      account_number_last4: readNullableString(rec, 'account_number_last4'),
      ifsc_code: readNullableString(rec, 'ifsc_code'),
      upi_id: readNullableString(rec, 'upi_id'),
      is_primary: readBoolean(rec, 'is_primary'),
      is_verified: readBoolean(rec, 'is_verified'),
      created_at: readString(rec, 'created_at'),
      updated_at: readString(rec, 'updated_at'),
    } as VendorPayoutAccount;
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────

/**
 * Lists notifications for the authenticated vendor user.
 */
export async function getVendorNotifications(
  userId: string,
  params: VendorListNotificationsQuery,
): Promise<PaginatedResponse<VendorNotification>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.is_read !== undefined) {
    query = query.eq('is_read', params.is_read);
  }

  const { data, error, count } = await query;
  if (error !== null) throwDb('getVendorNotifications', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;

  return {
    items: rows.map((r) => mapNotification(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error !== null) throwDb('markNotificationRead', error);
}

/**
 * Marks all notifications for the user as read.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error !== null) throwDb('markAllNotificationsRead', error);
}
