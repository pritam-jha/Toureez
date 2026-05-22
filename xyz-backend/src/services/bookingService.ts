/**
 * @file services/bookingService.ts
 * @description All database operations for the booking flow.
 *
 * Responsibilities:
 * - Price calculation (mirrors frontend usePriceCalculation exactly)
 * - Creating pending bookings
 * - Confirming mock payments (status → confirmed, payment_status → paid)
 * - Fetching booking lists and detail for the authenticated user
 */

import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabase } from '../lib/supabase';
import { createNotification } from './notificationService';
import type {
  Booking,
  BookingSummary,
  CreateBookingInput,
  PackagePricing,
  PriceCalculation,
  TravelerDetail,
} from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const GST_RATE = 0.05;
const GROUP_DISCOUNT_RATE = 0.05;
const GROUP_DISCOUNT_THRESHOLD = 7;
const ADVANCE_FRACTION = 0.3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const inrFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toRecord = (value: unknown): Record<string, unknown> => {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) ? first : {};
  }
  return isRecord(value) ? value : {};
};

const readString = (
  record: Record<string, unknown>,
  key: string,
  fallback = ''
): string => {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
};

const readNullableString = (
  record: Record<string, unknown>,
  key: string
): string | null => {
  const value = record[key];
  return typeof value === 'string' ? value : null;
};

const readNumber = (
  record: Record<string, unknown>,
  key: string,
  fallback = 0
): number => {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const readBoolean = (
  record: Record<string, unknown>,
  key: string,
  fallback = false
): boolean => {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  console.error(`[bookingService.${operation}]`, dbError);
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const emitPaymentNotifications = async ({
  userId,
  bookingId,
  packageId,
  packageName,
  destination,
  amountPaid,
  paymentType,
}: {
  userId: string;
  bookingId: string;
  packageId: string;
  packageName: string;
  destination: string;
  amountPaid: number;
  paymentType: 'full' | 'advance';
}): Promise<void> => {
  const results = await Promise.allSettled([
    createNotification(
      userId,
      'booking_confirmed',
      'Booking Confirmed!',
      `Your trip to ${destination} is confirmed.`,
      {
        booking_id: bookingId,
        destination,
        package_id: packageId,
        package_name: packageName,
      },
      bookingId,
      'booking'
    ),
    createNotification(
      userId,
      'payment_received',
      'Payment Received',
      `${inrFormatter.format(amountPaid)} received for ${packageName}`,
      {
        amount: amountPaid,
        booking_id: bookingId,
        currency: 'INR',
        package_id: packageId,
        package_name: packageName,
        payment_type: paymentType,
      },
      bookingId,
      'booking'
    ),
  ]);

  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('[bookingService.emitPaymentNotifications]', result.reason);
    }
  });
};

// ── Price calculation ─────────────────────────────────────────────────────────

/**
 * Computes the full price breakdown for a booking.
 * This is the authoritative calculation — the frontend mirrors it for display.
 */
export function calculatePrice(
  pricing: Pick<PackagePricing, 'base_price' | 'discounted_price'>,
  numTravelers: number,
  paymentType: 'full' | 'advance'
): PriceCalculation {
  const travelers = Math.max(1, Math.round(numTravelers));
  const basePrice = pricing.discounted_price ?? pricing.base_price;

  const subtotal = basePrice * travelers;

  const groupDiscount =
    travelers >= GROUP_DISCOUNT_THRESHOLD
      ? Math.round(subtotal * GROUP_DISCOUNT_RATE)
      : 0;

  const discountedSubtotal = subtotal - groupDiscount;
  const gst = Math.round(discountedSubtotal * GST_RATE);
  const totalAmount = discountedSubtotal + gst;

  const advanceAmount =
    paymentType === 'advance'
      ? Math.round(totalAmount * ADVANCE_FRACTION)
      : totalAmount;

  const balanceAmount =
    paymentType === 'advance' ? totalAmount - advanceAmount : 0;

  return {
    base_price: basePrice,
    num_travelers: travelers,
    subtotal,
    group_discount: groupDiscount,
    gst,
    total_amount: totalAmount,
    advance_amount: advanceAmount,
    balance_amount: balanceAmount,
    payment_type: paymentType,
  };
}

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapTravelerDetail = (value: unknown): TravelerDetail => {
  const record = toRecord(value);
  const gender = readString(record, 'gender');
  const idType = readString(record, 'id_type');

  return {
    name: readString(record, 'name'),
    age: readNumber(record, 'age'),
    gender:
      gender === 'male' || gender === 'female' || gender === 'other'
        ? gender
        : 'other',
    id_type:
      idType === 'aadhaar' ||
      idType === 'passport' ||
      idType === 'driving_license'
        ? idType
        : 'aadhaar',
    id_number: readString(record, 'id_number'),
    is_primary: readBoolean(record, 'is_primary'),
  };
};

const mapBookingStatus = (
  value: unknown
): Booking['status'] => {
  const s = typeof value === 'string' ? value : '';
  if (
    s === 'pending' ||
    s === 'confirmed' ||
    s === 'cancelled' ||
    s === 'completed'
  ) {
    return s;
  }
  return 'pending';
};

const mapPaymentStatus = (
  value: unknown
): Booking['payment_status'] => {
  const s = typeof value === 'string' ? value : '';
  if (s === 'pending' || s === 'paid' || s === 'refunded' || s === 'failed') {
    return s;
  }
  return 'pending';
};

const mapBooking = (record: Record<string, unknown>): Booking => {
  const rawTravelers = record['traveler_details'];
  const travelers = Array.isArray(rawTravelers)
    ? rawTravelers.map(mapTravelerDetail)
    : [];
  const pkgRaw = toRecord(record['package']);
  const locationRaw = toRecord(pkgRaw['location']);
  const companyRaw = toRecord(record['company']);
  const rawPayments = Array.isArray(record['payments'])
    ? record['payments'].map(toRecord)
    : [];
  const paymentRecord = rawPayments
    .filter((payment) => {
      const status = mapPaymentStatus(payment['status']);
      return status === 'paid' || status === 'refunded';
    })
    .sort((left, right) =>
      readString(right, 'created_at').localeCompare(readString(left, 'created_at'))
    )[0];
  const advanceAmount = readNumber(record, 'advance_amount');
  const balanceAmount = readNumber(record, 'balance_amount');
  const paymentStatus = mapPaymentStatus(record['payment_status']);
  const amountPaid =
    paymentRecord !== undefined
      ? readNumber(paymentRecord, 'amount')
      : paymentStatus === 'paid' || paymentStatus === 'refunded'
        ? advanceAmount
        : 0;

  const booking: Booking = {
    id: readString(record, 'id'),
    user_id: readString(record, 'user_id'),
    package_id: readString(record, 'package_id'),
    company_id: readString(record, 'company_id'),
    pricing_id: readString(record, 'pricing_id'),
    booking_reference: readString(record, 'booking_reference'),
    travel_date: readString(record, 'travel_date'),
    num_travelers: readNumber(record, 'num_travelers'),
    total_amount: readNumber(record, 'total_amount'),
    advance_amount: advanceAmount,
    balance_amount: balanceAmount,
    status: mapBookingStatus(record['status']),
    payment_status: paymentStatus,
    special_requests: readNullableString(record, 'special_requests'),
    traveler_details: travelers,
    created_at: readString(record, 'created_at'),
    updated_at: readString(record, 'updated_at'),
    payment: {
      amount_paid: amountPaid,
      payment_method:
        paymentRecord !== undefined
          ? readNullableString(paymentRecord, 'payment_method')
          : null,
      paid_at:
        paymentRecord !== undefined
          ? readNullableString(paymentRecord, 'created_at')
          : null,
      payment_type: balanceAmount > 0 ? 'advance' : 'full',
    },
  };

  if (readString(pkgRaw, 'id') !== '') {
    booking.package = {
      id: readString(pkgRaw, 'id'),
      title: readString(pkgRaw, 'title'),
      cover_image: readNullableString(pkgRaw, 'cover_image'),
      duration_days: readNumber(pkgRaw, 'duration_days'),
      duration_nights: readNumber(pkgRaw, 'duration_nights'),
      location: {
        city: readString(locationRaw, 'city'),
        state: readString(locationRaw, 'state'),
      },
    };
  }

  if (readString(companyRaw, 'id') !== '') {
    booking.company = {
      id: readString(companyRaw, 'id'),
      name: readString(companyRaw, 'name'),
      logo_url: readNullableString(companyRaw, 'logo_url'),
      is_verified: readBoolean(companyRaw, 'is_verified'),
    };
  }

  return booking;
};

const mapBookingSummary = (record: Record<string, unknown>): BookingSummary => {
  const pkgRaw = toRecord(record['package']);
  const locationRaw = toRecord(pkgRaw['location']);
  const companyRaw = toRecord(record['company']);

  return {
    id: readString(record, 'id'),
    booking_reference: readString(record, 'booking_reference'),
    travel_date: readString(record, 'travel_date'),
    num_travelers: readNumber(record, 'num_travelers'),
    total_amount: readNumber(record, 'total_amount'),
    status: mapBookingStatus(record['status']),
    payment_status: mapPaymentStatus(record['payment_status']),
    package: {
      id: readString(pkgRaw, 'id'),
      title: readString(pkgRaw, 'title'),
      cover_image: readNullableString(pkgRaw, 'cover_image'),
      duration_days: readNumber(pkgRaw, 'duration_days'),
      location: {
        city: readString(locationRaw, 'city'),
        state: readString(locationRaw, 'state'),
      },
    },
    company: {
      name: readString(companyRaw, 'name'),
      logo_url: readNullableString(companyRaw, 'logo_url'),
    },
    created_at: readString(record, 'created_at'),
  };
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Creates a pending booking after verifying the package and pricing tier.
 * Returns the created booking and the computed price breakdown.
 */
export async function createBooking(
  userId: string,
  input: CreateBookingInput
): Promise<{ booking: Booking; price_calculation: PriceCalculation }> {
  // 1. Verify package exists and is active
  const { data: pkgData, error: pkgError } = await supabase
    .from('packages')
    .select('id, company_id, status')
    .eq('id', input.package_id)
    .eq('status', 'active')
    .maybeSingle();

  if (pkgError !== null) throwDatabaseError('createBooking.verifyPackage', pkgError);
  if (pkgData === null) throw new AppError('Package not found or not active', 404);

  const pkgRecord = toRecord(pkgData);
  const companyId = readString(pkgRecord, 'company_id');

  // 2. Verify pricing tier exists and is active for this package
  const { data: pricingData, error: pricingError } = await supabase
    .from('package_pricing')
    .select('id, package_id, base_price, discounted_price, is_active')
    .eq('id', input.pricing_id)
    .eq('package_id', input.package_id)
    .eq('is_active', true)
    .maybeSingle();

  if (pricingError !== null)
    throwDatabaseError('createBooking.verifyPricing', pricingError);
  if (pricingData === null)
    throw new AppError('Pricing tier not found or not active', 404);

  const pricingRecord = toRecord(pricingData);
  const pricing = {
    base_price: readNumber(pricingRecord, 'base_price'),
    discounted_price:
      pricingRecord['discounted_price'] === null
        ? null
        : readNumber(pricingRecord, 'discounted_price'),
  };

  // 3. Calculate amounts
  const calc = calculatePrice(pricing, input.num_travelers, input.payment_type);

  // 4. Insert booking row (booking_reference generated by DB trigger)
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      package_id: input.package_id,
      company_id: companyId,
      pricing_id: input.pricing_id,
      travel_date: input.travel_date,
      num_travelers: input.num_travelers,
      total_amount: calc.total_amount,
      advance_amount: calc.advance_amount,
      balance_amount: calc.balance_amount,
      status: 'pending',
      payment_status: 'pending',
      special_requests: input.special_requests ?? null,
      traveler_details: input.traveler_details,
    })
    .select()
    .single();

  if (bookingError !== null)
    throwDatabaseError('createBooking.insert', bookingError);
  if (bookingData === null)
    throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);

  const booking = mapBooking(toRecord(bookingData));

  return { booking, price_calculation: calc };
}

/**
 * Confirms a mock payment by updating booking and payment_status.
 * Creates a mock payment record for audit trail.
 *
 * NOTE: Replace this function body with Razorpay signature verification.
 */
export async function confirmMockPayment(
  userId: string,
  bookingId: string,
  paymentType: 'full' | 'advance'
): Promise<{ booking: Booking }> {
  // 1. Verify booking belongs to this user and is in pending state
  const { data: existingData, error: fetchError } = await supabase
    .from('bookings')
    .select(
      `
      id,
      user_id,
      status,
      payment_status,
      advance_amount,
      total_amount,
      package_id,
      package:packages!bookings_package_id_fkey(
        id,
        title,
        location:locations(city)
      )
    `
    )
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError !== null)
    throwDatabaseError('confirmMockPayment.fetch', fetchError);
  if (existingData === null)
    throw new AppError('Booking not found', 404);

  const existingRecord = toRecord(existingData);
  const currentStatus = mapBookingStatus(existingRecord['status']);

  if (currentStatus !== 'pending') {
    throw new AppError('Booking is not in a pending state', 400);
  }

  const amountPaid =
    paymentType === 'advance'
      ? readNumber(existingRecord, 'advance_amount')
      : readNumber(existingRecord, 'total_amount');
  const packageRecord = toRecord(existingRecord['package']);
  const locationRecord = toRecord(packageRecord['location']);
  const packageId =
    readString(packageRecord, 'id') || readString(existingRecord, 'package_id');
  const packageName = readString(packageRecord, 'title') || 'your package';
  const destination = readString(locationRecord, 'city') || 'your destination';

  // 2. Update booking status → confirmed, payment_status → paid
  const { data: updatedData, error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError !== null)
    throwDatabaseError('confirmMockPayment.update', updateError);
  if (updatedData === null)
    throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);

  // 3. Create a mock payment record for audit trail
  // NOTE: Replace with Razorpay payment record when integrating
  const { error: paymentError } = await supabase.from('payments').insert({
    booking_id: bookingId,
    amount: amountPaid,
    currency: 'INR',
    payment_method: 'mock',
    status: 'paid',
    razorpay_payment_id: `MOCK_${Date.now()}`,
    razorpay_order_id: `MOCK_ORDER_${Date.now()}`,
    gateway_response: {
      gateway: 'mock',
      payment_type: paymentType,
    },
  });

  // Payment record failure is non-fatal — log and continue
  if (paymentError !== null) {
    console.error('[bookingService.confirmMockPayment.payment]', paymentError);
  }

  await emitPaymentNotifications({
    userId,
    bookingId,
    packageId,
    packageName,
    destination,
    amountPaid,
    paymentType,
  });

  const booking = mapBooking(toRecord(updatedData));

  return { booking };
}

/**
 * Returns all bookings for the authenticated user, ordered by created_at desc.
 * Includes denormalised package, location, and company data.
 */
export async function getMyBookings(userId: string): Promise<BookingSummary[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      booking_reference,
      travel_date,
      num_travelers,
      total_amount,
      status,
      payment_status,
      created_at,
      package:packages!bookings_package_id_fkey(
        id,
        title,
        duration_days,
        location:locations(city, state)
      ),
      company:companies(name, logo_url)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error !== null) throwDatabaseError('getMyBookings', error);

  const rows = (data as unknown[] | null) ?? [];

  // Fetch cover images separately (same pattern as packageService)
  const packageIds = rows
    .map((row) => {
      const record = toRecord(row);
      const pkg = toRecord(record['package']);
      return readString(pkg, 'id');
    })
    .filter((id) => id !== '');

  const coverImageMap = new Map<string, string | null>();
  if (packageIds.length > 0) {
    const { data: imgData } = await supabase
      .from('package_images')
      .select('package_id, url')
      .in('package_id', packageIds)
      .eq('is_cover', true);

    (imgData as unknown[] | null)?.forEach((img) => {
      const imgRecord = toRecord(img);
      const pkgId = readString(imgRecord, 'package_id');
      const url = readString(imgRecord, 'url');
      if (pkgId && url && !coverImageMap.has(pkgId)) {
        coverImageMap.set(pkgId, url);
      }
    });
  }

  return rows.map((row) => {
    const record = toRecord(row);
    const pkgRecord = toRecord(record['package']);
    const pkgId = readString(pkgRecord, 'id');

    // Inject cover_image into the package record for the mapper
    const enrichedRecord = {
      ...record,
      package: {
        ...pkgRecord,
        cover_image: coverImageMap.get(pkgId) ?? null,
      },
    };

    return mapBookingSummary(enrichedRecord);
  });
}

/**
 * Returns the full booking detail for a single booking.
 * Only returns the booking if it belongs to the requesting user.
 */
export async function getBookingById(
  userId: string,
  bookingId: string
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      package:packages!bookings_package_id_fkey(
        id,
        title,
        duration_days,
        duration_nights,
        location:locations(city, state)
      ),
      company:companies(id, name, logo_url, is_verified),
      payments(amount, payment_method, status, created_at)
    `
    )
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error !== null) throwDatabaseError('getBookingById', error);
  if (data === null) throw new AppError('Booking not found', 404);

  const record = toRecord(data);
  const packageRecord = toRecord(record['package']);
  const packageId = readString(packageRecord, 'id');
  let coverImage: string | null = null;

  if (packageId !== '') {
    const { data: coverImageData, error: coverImageError } = await supabase
      .from('package_images')
      .select('url')
      .eq('package_id', packageId)
      .eq('is_cover', true)
      .maybeSingle();

    if (coverImageError !== null) {
      console.error('[bookingService.getBookingById.coverImage]', coverImageError);
    } else {
      coverImage = readNullableString(toRecord(coverImageData), 'url');
    }
  }

  return mapBooking({
    ...record,
    package: {
      ...packageRecord,
      cover_image: coverImage,
    },
  });
}

function daysUntilTravel(travelDate: string): number {
  const travelDay = Date.parse(`${travelDate.slice(0, 10)}T00:00:00.000Z`);
  const now = new Date();
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  if (!Number.isFinite(travelDay)) return 0;
  return Math.ceil((travelDay - today) / MS_PER_DAY);
}

function refundFractionForTravelDate(travelDate: string): number {
  const days = daysUntilTravel(travelDate);
  if (days > 30) return 1;
  if (days >= 15) return 0.5;
  return 0;
}

/**
 * Cancels an eligible booking and calculates the refundable paid amount.
 */
export async function cancelBooking(
  userId: string,
  bookingId: string
): Promise<{ booking: Booking; refund_amount: number }> {
  const { data: existingData, error: fetchError } = await supabase
    .from('bookings')
    .select('id, user_id, status, payment_status, travel_date, advance_amount')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError !== null) throwDatabaseError('cancelBooking.fetch', fetchError);
  if (existingData === null) throw new AppError('Booking not found', 404);

  const existingRecord = toRecord(existingData);
  const status = mapBookingStatus(existingRecord['status']);
  const paymentStatus = mapPaymentStatus(existingRecord['payment_status']);

  if (status !== 'confirmed' && status !== 'pending') {
    throw new AppError('Only confirmed or pending bookings can be cancelled', 400);
  }

  const paidAmount =
    paymentStatus === 'paid' ? readNumber(existingRecord, 'advance_amount') : 0;
  const refundAmount = Math.round(
    paidAmount *
      refundFractionForTravelDate(readString(existingRecord, 'travel_date'))
  );
  const nextPaymentStatus = refundAmount > 0 ? 'refunded' : paymentStatus;

  const { data: updatedData, error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      payment_status: nextPaymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('user_id', userId)
    .in('status', ['confirmed', 'pending'])
    .select('id')
    .maybeSingle();

  if (updateError !== null) throwDatabaseError('cancelBooking.update', updateError);
  if (updatedData === null) {
    throw new AppError('Booking can no longer be cancelled', 409);
  }

  return {
    booking: await getBookingById(userId, bookingId),
    refund_amount: refundAmount,
  };
}
