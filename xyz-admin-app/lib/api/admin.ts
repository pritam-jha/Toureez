/**
 * @file lib/api/admin.ts
 * @description Typed API client wrappers for all /api/v1/admin/* endpoints.
 *
 * All functions use apiClient (Bearer-token injected, never throws).
 * Callers check response.error before using response.data.
 *
 * Admin-only — every call is authenticated and requires the 'admin' role.
 * Role enforcement happens on the backend; the frontend additionally guards
 * at the layout level.
 */

import { apiClient } from './client';
import type { BackendApiResponse } from '../../types';
import type {
  AdminDashboardMetrics,
  AdminUser,
  AdminVendor,
  AdminPackageListItem,
  AdminBooking,
  AdminAuditLog,
  AdminPayout,
  AdminListParams,
  AdminVendorListParams,
  AdminPackageListParams,
  AdminBookingListParams,
  AdminReviewListParams,
  AdminPayoutListParams,
  AdminAuditLogListParams,
} from '../../types/admin';
import type { AdminNotification, Category, Location, PaginatedResponse, Review } from '../../types';

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getAdminDashboard(): Promise<BackendApiResponse<AdminDashboardMetrics>> {
  return apiClient.get<AdminDashboardMetrics>('/admin/dashboard');
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getAdminUsers(
  params: AdminListParams & { role?: string },
): Promise<BackendApiResponse<PaginatedResponse<AdminUser>>> {
  return apiClient.get<PaginatedResponse<AdminUser>>('/admin/users', params as Record<string, string | number | boolean | null | undefined>);
}

export async function getAdminUser(
  userId: string,
): Promise<BackendApiResponse<AdminUser & { email: string; booking_count: number }>> {
  return apiClient.get<AdminUser & { email: string; booking_count: number }>(
    `/admin/users/${encodeURIComponent(userId)}`,
  );
}

export async function updateAdminUserRole(
  userId: string,
  role: 'traveler' | 'company_owner' | 'admin',
): Promise<BackendApiResponse<AdminUser>> {
  return apiClient.patch<AdminUser>(`/admin/users/${encodeURIComponent(userId)}/role`, { role });
}

// ── Vendors ───────────────────────────────────────────────────────────────────

export async function getAdminVendors(
  params: AdminVendorListParams,
): Promise<BackendApiResponse<PaginatedResponse<AdminVendor>>> {
  return apiClient.get<PaginatedResponse<AdminVendor>>(
    '/admin/vendors',
    params as Record<string, string | number | boolean | null | undefined>,
  );
}

export async function getAdminVendor(
  vendorId: string,
): Promise<BackendApiResponse<AdminVendor>> {
  return apiClient.get<AdminVendor>(`/admin/vendors/${encodeURIComponent(vendorId)}`);
}

export async function approveAdminVendor(
  vendorId: string,
  note?: string,
): Promise<BackendApiResponse<AdminVendor>> {
  return apiClient.patch<AdminVendor>(`/admin/vendors/${encodeURIComponent(vendorId)}/approve`, { note });
}

export async function rejectAdminVendor(
  vendorId: string,
  reason: string,
): Promise<BackendApiResponse<AdminVendor>> {
  return apiClient.patch<AdminVendor>(`/admin/vendors/${encodeURIComponent(vendorId)}/reject`, { reason });
}

export async function verifyAdminVendor(
  vendorId: string,
): Promise<BackendApiResponse<AdminVendor>> {
  return apiClient.patch<AdminVendor>(`/admin/vendors/${encodeURIComponent(vendorId)}/verify`, {});
}

// ── Packages ──────────────────────────────────────────────────────────────────

export async function getAdminPackages(
  params: AdminPackageListParams,
): Promise<BackendApiResponse<PaginatedResponse<AdminPackageListItem>>> {
  return apiClient.get<PaginatedResponse<AdminPackageListItem>>(
    '/admin/packages',
    params as Record<string, string | number | boolean | null | undefined>,
  );
}

export async function getAdminPackage(
  packageId: string,
): Promise<BackendApiResponse<AdminPackageListItem>> {
  return apiClient.get<AdminPackageListItem>(
    `/admin/packages/${encodeURIComponent(packageId)}`,
  );
}

export async function approveAdminPackage(
  packageId: string,
  note?: string,
): Promise<BackendApiResponse<AdminPackageListItem>> {
  return apiClient.patch<AdminPackageListItem>(
    `/admin/packages/${encodeURIComponent(packageId)}/approve`,
    { note },
  );
}

export async function rejectAdminPackage(
  packageId: string,
  reason: string,
): Promise<BackendApiResponse<AdminPackageListItem>> {
  return apiClient.patch<AdminPackageListItem>(
    `/admin/packages/${encodeURIComponent(packageId)}/reject`,
    { reason },
  );
}

export async function featureAdminPackage(
  packageId: string,
  isFeatured: boolean,
  isBestseller?: boolean,
): Promise<BackendApiResponse<AdminPackageListItem>> {
  return apiClient.patch<AdminPackageListItem>(
    `/admin/packages/${encodeURIComponent(packageId)}/feature`,
    { is_featured: isFeatured, is_bestseller: isBestseller },
  );
}

export async function setBestsellerAdminPackage(
  packageId: string,
  isBestseller: boolean,
): Promise<BackendApiResponse<AdminPackageListItem>> {
  return apiClient.patch<AdminPackageListItem>(
    `/admin/packages/${encodeURIComponent(packageId)}/bestseller`,
    { is_bestseller: isBestseller },
  );
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function getAdminBookings(
  params: AdminBookingListParams,
): Promise<BackendApiResponse<PaginatedResponse<AdminBooking>>> {
  return apiClient.get<PaginatedResponse<AdminBooking>>(
    '/admin/bookings',
    params as Record<string, string | number | boolean | null | undefined>,
  );
}

export async function getAdminBooking(
  bookingId: string,
): Promise<BackendApiResponse<AdminBooking>> {
  return apiClient.get<AdminBooking>(
    `/admin/bookings/${encodeURIComponent(bookingId)}`,
  );
}

export async function updateAdminBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  note?: string,
): Promise<BackendApiResponse<AdminBooking>> {
  return apiClient.patch<AdminBooking>(
    `/admin/bookings/${encodeURIComponent(bookingId)}/status`,
    { status, note },
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function getAdminReviews(
  params: AdminReviewListParams,
): Promise<BackendApiResponse<PaginatedResponse<Review>>> {
  return apiClient.get<PaginatedResponse<Review>>(
    '/admin/reviews',
    params as Record<string, string | number | boolean | null | undefined>,
  );
}

export async function publishAdminReview(
  reviewId: string,
): Promise<BackendApiResponse<Review>> {
  return apiClient.patch<Review>(`/admin/reviews/${encodeURIComponent(reviewId)}/publish`, {});
}

export async function unpublishAdminReview(
  reviewId: string,
): Promise<BackendApiResponse<Review>> {
  return apiClient.patch<Review>(`/admin/reviews/${encodeURIComponent(reviewId)}/unpublish`, {});
}

export async function verifyAdminReview(
  reviewId: string,
): Promise<BackendApiResponse<Review>> {
  return apiClient.patch<Review>(`/admin/reviews/${encodeURIComponent(reviewId)}/verify`, {});
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getAdminCategories(): Promise<BackendApiResponse<Category[]>> {
  return apiClient.get<Category[]>('/admin/categories');
}

export async function createAdminCategory(input: {
  name: string;
  label: string;
  icon: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}): Promise<BackendApiResponse<Category>> {
  return apiClient.post<Category>('/admin/categories', input);
}

export async function updateAdminCategory(
  categoryId: string,
  input: Partial<{
    name: string;
    label: string;
    icon: string;
    description: string;
    is_active: boolean;
    display_order: number;
  }>,
): Promise<BackendApiResponse<Category>> {
  return apiClient.patch<Category>(`/admin/categories/${encodeURIComponent(categoryId)}`, input);
}

export async function deleteAdminCategory(
  categoryId: string,
): Promise<BackendApiResponse<{ deleted: boolean }>> {
  return apiClient.delete<{ deleted: boolean }>(`/admin/categories/${encodeURIComponent(categoryId)}`);
}

// ── Locations ─────────────────────────────────────────────────────────────────

export async function getAdminLocations(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<BackendApiResponse<PaginatedResponse<Location>>> {
  return apiClient.get<PaginatedResponse<Location>>(
    '/admin/locations',
    params as Record<string, string | number | boolean | null | undefined>,
  );
}

export async function createAdminLocation(input: {
  city: string;
  state: string;
  region: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_popular?: boolean;
  is_active?: boolean;
}): Promise<BackendApiResponse<Location>> {
  return apiClient.post<Location>('/admin/locations', input);
}

export async function updateAdminLocation(
  locationId: string,
  input: Partial<{
    city: string;
    state: string;
    region: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    is_popular: boolean;
    is_active: boolean;
  }>,
): Promise<BackendApiResponse<Location>> {
  return apiClient.patch<Location>(`/admin/locations/${encodeURIComponent(locationId)}`, input);
}

export async function deleteAdminLocation(
  locationId: string,
): Promise<BackendApiResponse<{ deleted: boolean }>> {
  return apiClient.delete<{ deleted: boolean }>(`/admin/locations/${encodeURIComponent(locationId)}`);
}

// ── Payouts ───────────────────────────────────────────────────────────────────

export async function getAdminPayouts(
  params: AdminPayoutListParams,
): Promise<BackendApiResponse<PaginatedResponse<AdminPayout>>> {
  return apiClient.get<PaginatedResponse<AdminPayout>>(
    '/admin/payouts',
    params as Record<string, string | number | boolean | null | undefined>,
  );
}

export async function updateAdminPayoutStatus(
  payoutId: string,
  status: 'pending' | 'processing' | 'paid' | 'failed',
  note?: string,
): Promise<BackendApiResponse<AdminPayout>> {
  return apiClient.patch<AdminPayout>(
    `/admin/payouts/${encodeURIComponent(payoutId)}/status`,
    { status, note },
  );
}

// ── Audit logs ────────────────────────────────────────────────────────────────

export async function getAdminAuditLogs(
  params: AdminAuditLogListParams,
): Promise<BackendApiResponse<PaginatedResponse<AdminAuditLog>>> {
  return apiClient.get<PaginatedResponse<AdminAuditLog>>(
    '/admin/audit-logs',
    params as Record<string, string | number | boolean | null | undefined>,
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
// Admin notifications use the shared /notifications endpoint (same as traveler).
// The backend scopes results to req.user.id, so each role sees only its own items.

export async function getAdminNotifications(params?: {
  page?: number;
  limit?: number;
}): Promise<BackendApiResponse<PaginatedResponse<AdminNotification>>> {
  return apiClient.get<PaginatedResponse<AdminNotification>>(
    '/notifications',
    params as Record<string, string | number | boolean | null | undefined>,
  );
}

export async function markAdminNotificationRead(
  notificationId: string,
): Promise<BackendApiResponse<{ marked_read: boolean }>> {
  return apiClient.patch<{ marked_read: boolean }>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    {},
  );
}

export async function markAllAdminNotificationsRead(): Promise<BackendApiResponse<{ marked_read: boolean }>> {
  return apiClient.patch<{ marked_read: boolean }>('/notifications/read-all', {});
}
