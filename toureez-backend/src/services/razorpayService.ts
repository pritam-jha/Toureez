/**
 * @file services/razorpayService.ts
 * Razorpay payment gateway integration.
 *
 * Flow:
 *  1. createRazorpayOrder()  — called before checkout opens, returns order_id
 *  2. verifyRazorpayPayment() — called after checkout completes, verifies signature
 *     and updates the booking + payment record to paid.
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '../lib/supabase';
import { AppError } from '../constants/errors';
import { logger } from '../utils/logger';
import { toRecord, readString, readNumber } from '../utils/dbHelpers';
import { sendBookingConfirmationEmail } from '../lib/email';

// ── Client ────────────────────────────────────────────────────────────────────

function getRazorpay(): Razorpay {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new AppError('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.', 503);
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RazorpayOrderResult {
  order_id:   string;
  amount:     number; // in paise
  currency:   string;
  key_id:     string;
  booking_id: string;
}

// ── Create order ─────────────────────────────────────────────────────────────

/**
 * Creates a Razorpay order for a pending booking.
 * Amount is determined by the booking's payment_type (full or advance).
 */
export async function createRazorpayOrder(
  bookingId: string,
  userId: string,
): Promise<RazorpayOrderResult> {
  // Fetch the booking — must belong to this user and be pending payment
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, total_amount, advance_amount, payment_type, payment_status, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (error !== null) {
    logger.error({ err: error, bookingId }, 'createRazorpayOrder: DB error');
    throw new AppError('Could not load booking', 500);
  }
  if (data === null) throw new AppError('Booking not found', 404);

  const row = toRecord(data);

  if (readString(row, 'user_id') !== userId) {
    throw new AppError('Forbidden', 403);
  }

  const paymentStatus = readString(row, 'payment_status');
  if (paymentStatus === 'paid') {
    throw new AppError('This booking has already been paid', 409);
  }

  const paymentType  = readString(row, 'payment_type'); // 'full' | 'advance'
  const totalAmount  = readNumber(row, 'total_amount');
  const advanceAmount = readNumber(row, 'advance_amount');

  const amountInPaise =
    paymentType === 'advance'
      ? Math.round(advanceAmount * 100)
      : Math.round(totalAmount  * 100);

  if (amountInPaise < 100) {
    throw new AppError('Amount too small for payment processing', 400);
  }

  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount:   amountInPaise,
    currency: 'INR',
    receipt:  bookingId.slice(0, 40), // Razorpay receipt max 40 chars
    notes: {
      booking_id: bookingId,
      user_id:    userId,
    },
  });

  logger.info({ bookingId, orderId: order.id, amountInPaise }, 'Razorpay order created');

  return {
    order_id:   order.id,
    amount:     amountInPaise,
    currency:   'INR',
    key_id:     process.env.RAZORPAY_KEY_ID!,
    booking_id: bookingId,
  };
}

// ── Verify payment ────────────────────────────────────────────────────────────

/**
 * Verifies the Razorpay payment signature and marks the booking as paid.
 *
 * Razorpay signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 */
export async function verifyRazorpayPayment(params: {
  booking_id:          string;
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
  user_id:             string;
}): Promise<{ booking_id: string; payment_id: string; status: string }> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new AppError('Razorpay credentials not configured', 503);
  }

  // Verify HMAC signature
  const body      = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  const expected  = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(params.razorpay_signature ?? '', 'hex');
  const signatureValid =
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

  if (!signatureValid) {
    logger.warn({ bookingId: params.booking_id }, 'Razorpay signature mismatch');
    throw new AppError('Payment verification failed — invalid signature', 400);
  }

  // Confirm booking owns this user
  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from('bookings')
    .select(
      `
      id, user_id, total_amount, advance_amount, payment_type, status,
      booking_reference, travel_date, num_travelers,
      package:packages!bookings_package_id_fkey(title, location:locations(city)),
      company:companies(name)
    `
    )
    .eq('id', params.booking_id)
    .maybeSingle();

  if (bookingErr !== null || booking === null) {
    throw new AppError('Booking not found', 404);
  }

  const row = toRecord(booking);
  if (readString(row, 'user_id') !== params.user_id) {
    throw new AppError('Forbidden', 403);
  }

  // Idempotency: this payment may already have been recorded by the webhook
  // (or by a retried/duplicated client call) — skip re-processing if so.
  const { data: existingPayment } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('razorpay_payment_id', params.razorpay_payment_id)
    .maybeSingle();

  if (existingPayment !== null) {
    logger.info({ bookingId: params.booking_id }, 'Razorpay payment already recorded — skipping duplicate');
    return { booking_id: params.booking_id, payment_id: readString(toRecord(existingPayment), 'id'), status: 'confirmed' };
  }

  const paymentType   = readString(row, 'payment_type');
  const totalAmount   = readNumber(row, 'total_amount');
  const advanceAmount = readNumber(row, 'advance_amount');
  const paidAmount    = paymentType === 'advance' ? advanceAmount : totalAmount;
  const balanceAmount = paymentType === 'advance' ? totalAmount - advanceAmount : 0;

  // Insert payment record
  const { error: paymentErr } = await supabaseAdmin.from('payments').insert({
    booking_id:           params.booking_id,
    user_id:              params.user_id,
    amount:               paidAmount,
    currency:             'INR',
    status:               'paid',
    payment_method:       'razorpay',
    razorpay_order_id:    params.razorpay_order_id,
    razorpay_payment_id:  params.razorpay_payment_id,
    razorpay_signature:   params.razorpay_signature,
  });

  if (paymentErr !== null) {
    logger.error({ err: paymentErr, bookingId: params.booking_id }, 'Failed to insert payment record');
    // Non-fatal — booking is still confirmed below
  }

  // Update booking status to confirmed
  const { error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({
      status:         'confirmed',
      payment_status: 'paid',
      balance_amount: balanceAmount,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', params.booking_id);

  if (updateErr !== null) {
    logger.error({ err: updateErr, bookingId: params.booking_id }, 'Failed to update booking after payment');
    throw new AppError('Payment verified but booking update failed. Contact support.', 500);
  }

  logger.info(
    { bookingId: params.booking_id, paymentId: params.razorpay_payment_id },
    'Razorpay payment verified and booking confirmed',
  );

  // Fire-and-forget booking confirmation email — never block the response
  const packageRecord = toRecord(row['package']);
  const locationRecord = toRecord(packageRecord['location']);
  const companyRecord = toRecord(row['company']);

  void supabaseAdmin.auth.admin.getUserById(params.user_id)
    .then(({ data: userData, error: userError }) => {
      const userEmail = userData?.user?.email;
      if (userError || !userEmail) {
        logger.error({ err: userError, bookingId: params.booking_id }, 'Failed to load user email for confirmation');
        return;
      }

      return sendBookingConfirmationEmail({
        to: userEmail,
        booking_reference: readString(row, 'booking_reference'),
        package_name: readString(packageRecord, 'title'),
        travel_date: readString(row, 'travel_date'),
        num_travelers: readNumber(row, 'num_travelers'),
        amount_paid: paidAmount,
        payment_type: paymentType as 'full' | 'advance',
        balance_amount: balanceAmount,
        company_name: readString(companyRecord, 'name'),
        destination: readString(locationRecord, 'city'),
      });
    })
    .catch((err) =>
      logger.error({ err, bookingId: params.booking_id }, 'Failed to send booking confirmation email')
    );

  return {
    booking_id: params.booking_id,
    payment_id: params.razorpay_payment_id,
    status:     'confirmed',
  };
}
