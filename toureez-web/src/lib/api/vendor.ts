import { apiClient, unwrapItems } from './client';
import type { PackageSummary } from './packages';
import type { Booking } from './bookings';
import type { Review } from './reviews';
import type { Enquiry, EnquiryMessage } from './enquiries';
import type { AppNotification } from './notifications';

export interface VendorProfile {
  id: string;
  full_name: string;
  email: string;
  [key: string]: unknown;
}

export interface DashboardMetrics {
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
  recent_bookings: unknown[];
}

export interface Company {
  id?: string;
  name: string;
  about?: string;
  gst_number?: string;
  logo_url?: string;
  cover_url?: string;
  status?: 'pending' | 'approved' | 'rejected';
  is_verified?: boolean;
  [key: string]: unknown;
}

export interface PayoutAccount {
  id: string;
  account_holder_name: string;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  upi_id?: string | null;
  is_primary: boolean;
}

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  created_at: string;
  [key: string]: unknown;
}

export const vendorApi = {
  me: () => apiClient.get<VendorProfile>('/vendor/me', undefined, true),
  dashboard: () => apiClient.get<DashboardMetrics>('/vendor/dashboard', undefined, true),
  earnings: (month: string) =>
    apiClient.get<{ month: string; revenue: number; bookings: number }>('/vendor/earnings', { month }, true),

  getCompany: () => apiClient.get<Company>('/vendor/company', undefined, true),
  createCompany: (payload: Company) => apiClient.post<Company>('/vendor/company', payload),
  updateCompany: (payload: Partial<Company>) => apiClient.patch<Company>('/vendor/company', payload),
  uploadCompanyDocuments: (payload: { gst_url?: string; registration_url?: string }) =>
    apiClient.post<{ uploaded: boolean }>('/vendor/company/documents', payload),

  listPackages: (status?: string) =>
    unwrapItems<PackageSummary>(apiClient.get('/vendor/packages', { status }, true)),
  createPackage: (payload: {
    title: string;
    description: string;
    location_id: string;
    category_id: string;
    duration_days?: number;
    duration_nights?: number;
    min_group_size?: number;
    max_group_size?: number;
    highlights?: string[];
    inclusions?: string[];
    exclusions?: string[];
    amenities?: string[];
  }) => apiClient.post<PackageSummary>('/vendor/packages', payload),
  getPackage: (id: string) => apiClient.get<PackageSummary>(`/vendor/packages/${id}`, undefined, true),
  updatePackage: (id: string, payload: {
    title?: string;
    description?: string;
    location_id?: string;
    category_id?: string;
    duration_days?: number;
    duration_nights?: number;
    min_group_size?: number;
    max_group_size?: number;
    highlights?: string[];
    inclusions?: string[];
    exclusions?: string[];
    amenities?: string[];
  }) => apiClient.patch<PackageSummary>(`/vendor/packages/${id}`, payload),
  submitPackage: (id: string) => apiClient.patch<PackageSummary>(`/vendor/packages/${id}/submit`),
  updatePricing: (id: string, tiers: unknown[]) =>
    apiClient.patch<PackageSummary>(`/vendor/packages/${id}/pricing`, { tiers }),
  updateItinerary: (id: string, days: unknown[]) =>
    apiClient.patch<PackageSummary>(`/vendor/packages/${id}/itinerary`, { days }),
  deletePackage: (id: string) => apiClient.delete<{ deleted: boolean }>(`/vendor/packages/${id}`),
  duplicatePackage: (id: string) => apiClient.post<PackageSummary>(`/vendor/packages/${id}/duplicate`),
  setCoverImage: (id: string, imageId: string) =>
    apiClient.patch<{ updated: boolean }>(`/vendor/packages/${id}/images/${imageId}/cover`),
  deleteImage: (id: string, imageId: string) =>
    apiClient.delete<{ deleted: boolean }>(`/vendor/packages/${id}/images/${imageId}`),

  listBookings: (status?: string) => unwrapItems<Booking>(apiClient.get('/vendor/bookings', { status }, true)),
  getBooking: (id: string) => apiClient.get<Booking>(`/vendor/bookings/${id}`, undefined, true),
  updateBookingStatus: (id: string, status: string) =>
    apiClient.patch<Booking>(`/vendor/bookings/${id}/status`, { status }),

  listReviews: () => unwrapItems<Review>(apiClient.get('/vendor/reviews', undefined, true)),

  listEnquiries: () => apiClient.get<Enquiry[]>('/vendor/enquiries', undefined, true),
  getEnquiry: (id: string) => apiClient.get<Enquiry>(`/vendor/enquiries/${id}`, undefined, true),
  postEnquiryMessage: (id: string, message: string) =>
    apiClient.post<EnquiryMessage>(`/vendor/enquiries/${id}/messages`, { message }),
  updateEnquiryStatus: (id: string, status: 'open' | 'closed') =>
    apiClient.patch<Enquiry>(`/vendor/enquiries/${id}/status`, { status }),

  listPayouts: () => unwrapItems<Payout>(apiClient.get('/vendor/payouts', undefined, true)),
  listPayoutAccounts: () => apiClient.get<PayoutAccount[]>('/vendor/payout-accounts', undefined, true),
  addPayoutAccount: (payload: {
    account_holder_name: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    upi_id?: string;
    is_primary?: boolean;
  }) => apiClient.post<PayoutAccount>('/vendor/payout-accounts', payload),

  listNotifications: () => unwrapItems<AppNotification>(apiClient.get('/vendor/notifications', undefined, true)),
  markNotificationRead: (id: string) => apiClient.patch<{ updated: boolean }>(`/vendor/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch<{ updated: boolean }>('/vendor/notifications/read-all'),
};
