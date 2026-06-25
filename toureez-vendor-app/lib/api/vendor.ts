/**
 * @file lib/api/vendor.ts
 * @description Typed API functions for all vendor portal endpoints.
 *
 * Every function returns ApiResponse<T> — never throws.
 * Callers always check `error` before using `data`.
 *
 * All requests are authenticated via the Bearer token in the Zustand
 * auth store session (injected automatically by apiClient).
 */

import { apiClient } from './client';
import type { ApiResponse, BackendApiResponse, PaginatedResponse } from '../../types';
import type {
  VendorCompany,
  CompanyDocument,
  VendorDashboardMetrics,
  VendorPackageListItem,
  VendorPackageDetail,
  VendorPricingTier,
  VendorItineraryDay,
  VendorPackageImage,
  VendorBookingListItem,
  VendorBookingDetail,
  VendorReview,
  VendorPayout,
  VendorPayoutAccount,
  VendorNotification,
  EnquirySummary,
  EnquiryDetail,
  User,
} from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalises a BackendApiResponse<T> into the simpler ApiResponse<T> shape
 * that callers and hooks expect.
 */
function normalise<T>(res: BackendApiResponse<T>): ApiResponse<T> {
  return { data: res.data, error: res.error };
}

// ── Profile ───────────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated vendor's user profile and company summary.
 */
export async function getVendorMe(): Promise<ApiResponse<{ user: User; company: VendorCompany | null }>> {
  const res = await apiClient.get<{ user: User; company: VendorCompany | null }>('/vendor/me');
  return normalise(res);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

/**
 * Fetches dashboard metrics: packages, bookings, revenue, reviews, payouts.
 */
export async function getVendorDashboard(): Promise<ApiResponse<VendorDashboardMetrics>> {
  const res = await apiClient.get<VendorDashboardMetrics>('/vendor/dashboard');
  return normalise(res);
}

export interface VendorMonthlyEarnings {
  month: string;
  revenue: number;
  bookings: number;
}

/**
 * Fetches confirmed/completed booking revenue for a single calendar month
 * (format: "YYYY-MM"), used by the Earnings Overview month picker.
 */
export async function getVendorEarningsForMonth(month: string): Promise<ApiResponse<VendorMonthlyEarnings>> {
  const res = await apiClient.get<VendorMonthlyEarnings>(`/vendor/earnings?month=${month}`);
  return normalise(res);
}

// ── Company ───────────────────────────────────────────────────────────────────

/**
 * Fetches the vendor's company profile. Returns null data if not yet created.
 */
export async function getCompany(): Promise<ApiResponse<VendorCompany | null>> {
  const res = await apiClient.get<VendorCompany | null>('/vendor/company');
  return normalise(res);
}

/**
 * Creates the vendor's company profile (first-time onboarding).
 */
export async function createCompany(input: {
  name: string;
  about?: string;
  gst_number?: string;
  logo_url?: string;
  cover_url?: string;
}): Promise<ApiResponse<VendorCompany>> {
  const res = await apiClient.post<VendorCompany>('/vendor/company', input);
  return normalise(res);
}

/**
 * Updates the vendor's company profile. Partial update supported.
 */
export async function updateCompany(input: {
  name?: string;
  about?: string;
  gst_number?: string;
  logo_url?: string;
  cover_url?: string;
}): Promise<ApiResponse<VendorCompany>> {
  const res = await apiClient.patch<VendorCompany>('/vendor/company', input);
  return normalise(res);
}

/**
 * Saves a company document after client-side Cloudinary upload.
 */
export async function saveCompanyDocument(input: {
  document_type: 'trade_license' | 'gst_certificate' | 'pan_card' | 'other';
  url: string;
  public_id: string;
  label?: string;
}): Promise<ApiResponse<CompanyDocument>> {
  const res = await apiClient.post<CompanyDocument>('/vendor/company/documents', input);
  return normalise(res);
}

// ── Packages ──────────────────────────────────────────────────────────────────

/**
 * Lists the vendor's packages with optional status filter, search, and pagination.
 */
export async function listPackages(params?: {
  status?: 'draft' | 'pending' | 'active' | 'rejected';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorPackageListItem>>> {
  const res = await apiClient.get<PaginatedResponse<VendorPackageListItem>>('/vendor/packages', params as Record<string, string | number | boolean | null | undefined>);
  return normalise(res);
}

/**
 * Fetches full package detail including pricing, itinerary, and images.
 */
export async function getPackage(packageId: string): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.get<VendorPackageDetail>(`/vendor/packages/${packageId}`);
  return normalise(res);
}

/**
 * Creates a new draft package.
 */
export async function createPackage(input: {
  title: string;
  location_id: string;
  category_id: string;
  description?: string;
  highlights?: string[];
  duration_days?: number;
  duration_nights?: number;
  min_group_size?: number;
  max_group_size?: number;
  inclusions?: string[];
  exclusions?: string[];
  amenities?: string[];
}): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.post<VendorPackageDetail>('/vendor/packages', input);
  return normalise(res);
}

/**
 * Partially updates a package's core fields.
 */
export async function updatePackage(
  packageId: string,
  input: {
    title?: string;
    location_id?: string;
    category_id?: string;
    description?: string;
    highlights?: string[];
    duration_days?: number;
    duration_nights?: number;
    min_group_size?: number;
    max_group_size?: number;
    inclusions?: string[];
    exclusions?: string[];
    amenities?: string[];
  },
): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.patch<VendorPackageDetail>(`/vendor/packages/${packageId}`, input);
  return normalise(res);
}

/**
 * Submits a draft package for admin review (draft → pending).
 */
export async function submitPackage(packageId: string): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.patch<VendorPackageDetail>(`/vendor/packages/${packageId}/submit`);
  return normalise(res);
}

/**
 * Permanently deletes a draft or rejected package with no bookings.
 */
export async function deletePackage(packageId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  const res = await apiClient.delete<{ deleted: boolean }>(`/vendor/packages/${packageId}`);
  return normalise(res);
}

/**
 * Creates a draft copy of the package with "(Copy)" suffix.
 */
export async function duplicatePackage(packageId: string): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.post<VendorPackageDetail>(`/vendor/packages/${packageId}/duplicate`);
  return normalise(res);
}

/**
 * Replaces all pricing tiers for a package. Full replacement strategy.
 */
export async function upsertPricing(
  packageId: string,
  tiers: Array<{
    id?: string;
    label: string;
    min_people: number;
    max_people: number;
    base_price: number;
    discounted_price?: number | null;
    currency?: string;
    season?: 'all' | 'peak' | 'off-peak';
    valid_from?: string | null;
    valid_until?: string | null;
    is_active?: boolean;
  }>,
): Promise<ApiResponse<VendorPricingTier[]>> {
  const res = await apiClient.patch<VendorPricingTier[]>(`/vendor/packages/${packageId}/pricing`, { tiers });
  return normalise(res);
}

/**
 * Replaces all itinerary days for a package. Full replacement strategy.
 */
export async function upsertItinerary(
  packageId: string,
  days: Array<{
    id?: string;
    day_number: number;
    title: string;
    description?: string;
    meals?: string[];
    accommodation?: string;
    activities?: string[];
    transport?: string;
  }>,
): Promise<ApiResponse<VendorItineraryDay[]>> {
  const res = await apiClient.patch<VendorItineraryDay[]>(`/vendor/packages/${packageId}/itinerary`, { days });
  return normalise(res);
}

/**
 * Saves a Cloudinary-uploaded image for the package gallery.
 */
export async function savePackageImage(
  packageId: string,
  input: { url: string; public_id: string; alt_text?: string; is_cover?: boolean },
): Promise<ApiResponse<VendorPackageImage>> {
  const res = await apiClient.post<VendorPackageImage>(`/vendor/packages/${packageId}/images`, input);
  return normalise(res);
}

/**
 * Deletes a package image.
 */
export async function deletePackageImage(
  packageId: string,
  imageId: string,
): Promise<ApiResponse<{ deleted: boolean }>> {
  const res = await apiClient.delete<{ deleted: boolean }>(`/vendor/packages/${packageId}/images/${imageId}`);
  return normalise(res);
}

/**
 * Sets a specific image as the package cover.
 */
export async function setPackageCoverImage(
  packageId: string,
  imageId: string,
): Promise<ApiResponse<VendorPackageImage>> {
  const res = await apiClient.patch<VendorPackageImage>(`/vendor/packages/${packageId}/images/${imageId}/cover`);
  return normalise(res);
}

// ── Bookings ──────────────────────────────────────────────────────────────────

/**
 * Lists bookings for the vendor's company with optional filters.
 */
export async function listBookings(params?: {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed';
  package_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorBookingListItem>>> {
  const res = await apiClient.get<PaginatedResponse<VendorBookingListItem>>(
    '/vendor/bookings',
    params as Record<string, string | number | boolean | null | undefined>,
  );
  return normalise(res);
}

/**
 * Fetches full booking detail.
 */
export async function getBooking(bookingId: string): Promise<ApiResponse<VendorBookingDetail>> {
  const res = await apiClient.get<VendorBookingDetail>(`/vendor/bookings/${bookingId}`);
  return normalise(res);
}

/**
 * Updates a booking's status (confirmed | cancelled | completed).
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'cancelled' | 'completed',
  note?: string,
): Promise<ApiResponse<VendorBookingDetail>> {
  const res = await apiClient.patch<VendorBookingDetail>(`/vendor/bookings/${bookingId}/status`, {
    status,
    note,
  });
  return normalise(res);
}

// ── Reviews ───────────────────────────────────────────────────────────────────

/**
 * Lists published reviews for the vendor's packages.
 */
export async function listReviews(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorReview>>> {
  const res = await apiClient.get<PaginatedResponse<VendorReview>>(
    '/vendor/reviews',
    params as Record<string, string | number | boolean | null | undefined>,
  );
  return normalise(res);
}

// ── Enquiries ─────────────────────────────────────────────────────────────────

/**
 * Lists enquiry threads started by travelers about the vendor's company.
 */
export async function listEnquiries(): Promise<ApiResponse<EnquirySummary[]>> {
  const res = await apiClient.get<EnquirySummary[]>('/vendor/enquiries');
  return normalise(res);
}

/**
 * Fetches a single enquiry thread with all messages.
 */
export async function getEnquiry(enquiryId: string): Promise<ApiResponse<EnquiryDetail>> {
  const res = await apiClient.get<EnquiryDetail>(`/vendor/enquiries/${enquiryId}`);
  return normalise(res);
}

/**
 * Posts a reply to an enquiry thread.
 */
export async function sendEnquiryMessage(
  enquiryId: string,
  message: string,
): Promise<ApiResponse<EnquiryDetail>> {
  const res = await apiClient.post<EnquiryDetail>(`/vendor/enquiries/${enquiryId}/messages`, { message });
  return normalise(res);
}

/**
 * Marks an enquiry thread as open or closed.
 */
export async function setEnquiryStatus(
  enquiryId: string,
  status: 'open' | 'closed',
): Promise<ApiResponse<EnquiryDetail>> {
  const res = await apiClient.patch<EnquiryDetail>(`/vendor/enquiries/${enquiryId}/status`, { status });
  return normalise(res);
}

// ── Payouts ───────────────────────────────────────────────────────────────────

/**
 * Lists payout disbursement history.
 */
export async function listPayouts(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorPayout>>> {
  const res = await apiClient.get<PaginatedResponse<VendorPayout>>(
    '/vendor/payouts',
    params as Record<string, string | number | boolean | null | undefined>,
  );
  return normalise(res);
}

/**
 * Lists payout bank/UPI accounts.
 */
export async function listPayoutAccounts(): Promise<ApiResponse<VendorPayoutAccount[]>> {
  const res = await apiClient.get<VendorPayoutAccount[]>('/vendor/payout-accounts');
  return normalise(res);
}

/**
 * Adds a new payout account.
 */
export async function createPayoutAccount(input: {
  account_holder_name: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  is_primary?: boolean;
}): Promise<ApiResponse<VendorPayoutAccount>> {
  const res = await apiClient.post<VendorPayoutAccount>('/vendor/payout-accounts', input);
  return normalise(res);
}

/**
 * Adds a destination that isn't yet in the saved locations list.
 * Returns the existing location instead if the same city/state already exists.
 */
export async function createLocation(input: {
  city: string;
  state: string;
  region: 'North India' | 'South India' | 'East India' | 'West India' | 'Central India';
}): Promise<ApiResponse<{ id: string; city: string; state: string; is_popular: boolean }>> {
  const res = await apiClient.post<{ id: string; city: string; state: string; is_popular: boolean }>(
    '/vendor/locations',
    input,
  );
  return normalise(res);
}

// ── Public lookups (no auth required) ────────────────────────────────────────

/**
 * Fetches all active locations from the public endpoint.
 */
export async function listLocations(): Promise<ApiResponse<Array<{
  id: string; city: string; state: string; is_popular: boolean;
}>>> {
  const res = await apiClient.get<Array<{ id: string; city: string; state: string; is_popular: boolean }>>(
    '/locations',
    undefined,
    false,
  );
  return normalise(res);
}

/**
 * Fetches all active categories from the public endpoint.
 */
export async function listCategories(): Promise<ApiResponse<Array<{
  id: string; name: string; label: string; icon: string;
}>>> {
  const res = await apiClient.get<Array<{ id: string; name: string; label: string; icon: string }>>(
    '/categories',
    undefined,
    false,
  );
  return normalise(res);
}

// ── Notifications ─────────────────────────────────────────────────────────────

/**
 * Lists notifications for the authenticated vendor user.
 */
export async function listNotifications(params?: {
  is_read?: boolean;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorNotification>>> {
  const res = await apiClient.get<PaginatedResponse<VendorNotification>>(
    '/vendor/notifications',
    params as Record<string, string | number | boolean | null | undefined>,
  );
  return normalise(res);
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationRead(
  notificationId: string,
): Promise<ApiResponse<{ marked_read: boolean }>> {
  const res = await apiClient.patch<{ marked_read: boolean }>(
    `/vendor/notifications/${notificationId}/read`,
  );
  return normalise(res);
}

/**
 * Marks all notifications as read.
 */
export async function markAllNotificationsRead(): Promise<ApiResponse<{ marked_read: boolean }>> {
  const res = await apiClient.patch<{ marked_read: boolean }>('/vendor/notifications/read-all');
  return normalise(res);
}
