import { apiClient, unwrapItems } from './client';
import type { PackageSummary } from './packages';
import type { Booking } from './bookings';
import type { Review } from './reviews';
import type { Category } from './categories';
import type { Location } from './locations';
import type { Payout } from './vendor';

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

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status?: string;
  created_at: string;
  [key: string]: unknown;
}

export interface AdminVendor {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  about: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  total_packages: number;
  created_at: string;
  owner?: { full_name: string | null; email: string; phone: string | null };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  admin_email?: string;
  details?: unknown;
  created_at: string;
}

export const adminApi = {
  dashboard: () => apiClient.get<AdminDashboardMetrics>('/admin/dashboard', undefined, true),
  earnings: (month: string) =>
    apiClient.get<{ month: string; revenue: number }>('/admin/earnings', { month }, true),

  listUsers: (params?: { status?: string; role?: string }) =>
    unwrapItems<AdminUser>(apiClient.get('/admin/users', params, true)),
  getUser: (id: string) => apiClient.get<AdminUser>(`/admin/users/${id}`, undefined, true),
  updateUserRole: (id: string, role: string) =>
    apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role }),

  listVendors: (status?: string) => unwrapItems<AdminVendor>(apiClient.get('/admin/vendors', { status }, true)),
  getVendor: (id: string) => apiClient.get<AdminVendor>(`/admin/vendors/${id}`, undefined, true),
  approveVendor: (id: string) => apiClient.patch<AdminVendor>(`/admin/vendors/${id}/approve`),
  rejectVendor: (id: string, reason: string) =>
    apiClient.patch<AdminVendor>(`/admin/vendors/${id}/reject`, { reason }),
  verifyVendor: (id: string) => apiClient.patch<AdminVendor>(`/admin/vendors/${id}/verify`),

  listPackages: (params?: { status?: string; isFeatured?: boolean }) =>
    unwrapItems<PackageSummary>(
      apiClient.get('/admin/packages', { status: params?.status, is_featured: params?.isFeatured }, true)
    ),
  getPackage: (id: string) => apiClient.get<PackageSummary>(`/admin/packages/${id}`, undefined, true),
  approvePackage: (id: string) => apiClient.patch<PackageSummary>(`/admin/packages/${id}/approve`),
  rejectPackage: (id: string, reason: string) =>
    apiClient.patch<PackageSummary>(`/admin/packages/${id}/reject`, { reason }),
  featurePackage: (id: string, isFeatured: boolean) =>
    apiClient.patch<PackageSummary>(`/admin/packages/${id}/feature`, { is_featured: isFeatured }),
  bestsellerPackage: (id: string, isBestseller: boolean) =>
    apiClient.patch<PackageSummary>(`/admin/packages/${id}/bestseller`, { is_bestseller: isBestseller }),

  listBookings: (status?: string) => unwrapItems<Booking>(apiClient.get('/admin/bookings', { status }, true)),
  getBooking: (id: string) => apiClient.get<Booking>(`/admin/bookings/${id}`, undefined, true),
  updateBookingStatus: (id: string, status: string) =>
    apiClient.patch<Booking>(`/admin/bookings/${id}/status`, { status }),

  listReviews: (params?: { is_published?: boolean; is_verified?: boolean }) =>
    unwrapItems<Review>(apiClient.get('/admin/reviews', params, true)),
  publishReview: (id: string) => apiClient.patch<Review>(`/admin/reviews/${id}/publish`),
  unpublishReview: (id: string) => apiClient.patch<Review>(`/admin/reviews/${id}/unpublish`),
  verifyReview: (id: string) => apiClient.patch<Review>(`/admin/reviews/${id}/verify`),

  listCategories: () => unwrapItems<Category>(apiClient.get('/admin/categories', undefined, true)),
  createCategory: (payload: Partial<Category>) => apiClient.post<Category>('/admin/categories', payload),
  updateCategory: (id: string, payload: Partial<Category>) =>
    apiClient.patch<Category>(`/admin/categories/${id}`, payload),
  deleteCategory: (id: string) => apiClient.delete<{ deleted: boolean }>(`/admin/categories/${id}`),

  listLocations: () => unwrapItems<Location>(apiClient.get('/admin/locations', undefined, true)),
  createLocation: (payload: Partial<Location>) => apiClient.post<Location>('/admin/locations', payload),
  updateLocation: (id: string, payload: Partial<Location>) =>
    apiClient.patch<Location>(`/admin/locations/${id}`, payload),
  deleteLocation: (id: string) => apiClient.delete<{ deleted: boolean }>(`/admin/locations/${id}`),

  listPayouts: (status?: string) => unwrapItems<Payout>(apiClient.get('/admin/payouts', { status }, true)),
  updatePayoutStatus: (id: string, status: string) =>
    apiClient.patch<Payout>(`/admin/payouts/${id}/status`, { status }),

  listAuditLogs: (params?: { action?: string; entity_type?: string; from?: string; to?: string }) =>
    unwrapItems<AuditLogEntry>(apiClient.get('/admin/audit-logs', params, true)),
};
