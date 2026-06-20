import { apiClient } from './client';

export interface TravelerDetail {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  id_type: 'aadhaar' | 'passport' | 'driving_license';
  id_number: string;
  is_primary: boolean;
}

export interface CreateBookingPayload {
  package_id: string;
  pricing_id: string;
  travel_date: string;
  num_travelers: number;
  special_requests?: string;
  traveler_details: TravelerDetail[];
  payment_type: 'full' | 'advance';
  primary_contact: {
    full_name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
  };
}

export interface PriceCalculation {
  base_price: number;
  total_amount: number;
  advance_amount?: number;
  balance_amount?: number;
  [key: string]: unknown;
}

export interface Booking {
  id: string;
  package_id: string;
  status: string;
  travel_date: string;
  total_amount: number;
  created_at: string;
  package?: { id: string; title: string; duration_days?: number; cover_image?: string | null; location?: { city: string; state?: string } };
  company?: { id?: string; name: string; logo_url?: string | null };
  user?: { id: string; full_name: string | null; phone?: string | null; email: string };
  traveler_details?: unknown[];
  payment?: { amount_paid?: number; payment_method?: string | null; paid_at?: string | null; payment_type?: string } | null;
  [key: string]: unknown;
}

/** Backend nests the package under `booking.package`; this is the one place that should be read for the title. */
export function bookingPackageTitle(booking: Booking): string {
  return booking.package?.title ?? booking.package_id;
}

export async function createBooking(payload: CreateBookingPayload) {
  return apiClient.post<{ booking: Booking; price_calculation: PriceCalculation }>('/bookings/create', payload);
}

export async function createRazorpayOrder(bookingId: string) {
  return apiClient.post<{ order_id: string; amount: number; currency: string; key_id: string; booking_id: string }>(
    '/bookings/create-razorpay-order',
    { booking_id: bookingId }
  );
}

export async function verifyRazorpayPayment(payload: {
  booking_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return apiClient.post<{ booking_id: string; payment_id: string; status: string }>(
    '/bookings/verify-razorpay-payment',
    payload
  );
}

export async function confirmMockPayment(bookingId: string, paymentType: 'full' | 'advance' = 'full') {
  return apiClient.post<{ booking: Booking }>('/bookings/confirm-mock', { booking_id: bookingId, payment_type: paymentType });
}

export async function cancelBooking(id: string) {
  return apiClient.patch<{ booking: Booking; refund_amount: number }>(`/bookings/${id}/cancel`);
}

export async function listBookings(status?: string) {
  return apiClient.get<Booking[]>('/bookings', { status }, true);
}

export async function getBookingDetail(id: string) {
  return apiClient.get<Booking>(`/bookings/${id}`, undefined, true);
}

export async function getBookingInvoiceUrl(id: string) {
  return apiClient.get<{ url: string }>(`/bookings/${id}/invoice`, undefined, true);
}
