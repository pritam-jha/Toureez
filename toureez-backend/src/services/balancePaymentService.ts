/**
 * @file services/balancePaymentService.ts
 * Razorpay balance payment flow for advance bookings.
 *
 * Flow:
 *  1. createBalancePaymentOrder() — called before checkout opens, returns order_id
 *     for the remaining balance_amount.
 *  2. verifyBalancePayment() — called after checkout completes, verifies signature
 *     and marks the balance as paid.
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '../lib/supabase';
import { AppError } from '../constants/errors';
import { logger } from '../utils/logger';
import { toRecord, readString, readNumber } from '../utils/dbHelpers';
import type { RazorpayOrderResult } from './razorpayService';

// ── Client ────────────────────────────────────────────────────────────────────

function getRazorpay(): Razorpay {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new AppError('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.', 503);
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ── Create order ─────────────────────────────────────────────────────────────

/**
 * Creates a Razorpay order for the remaining balance of a confirmed advance booking.
 */
export async function createBalancePaymentOrder(
  bookingId: string,
  userId: string,
): Promise<RazorpayOrderResult> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, total_amount, advance_amount, balance_amount, payment_type, payment_status, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (error !== null) {
    logger.error({ err: error, bookingId }, 'createBalancePaymentOrder: DB error');
    throw new AppError('Could not load booking', 500);
  }
  if (data === null) throw new AppError('Booking not found', 404);

  const row = toRecord(data);

  if (readString(row, 'user_id') !== userId) {
    throw new AppError('Forbidden', 403);
  }

  if (readString(row, 'status') !== 'confirmed') {
    throw new AppError('Booking is not confirmed', 400);
  }

  if (readString(row, 'payment_type') !== 'advance') {
    throw new AppError('This booking was paid in full', 400);
  }

  const balanceAmount = readNumber(row, 'balance_amount');
  if (balanceAmount <= 0) {
    throw new AppError('Balance already paid', 409);
  }

  const amountInPaise = Math.round(balanceAmount * 100);

  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount:   amountInPaise,
    currency: 'INR',
    receipt:  bookingId.slice(0, 40), // Razorpay receipt max 40 chars
    notes: {
      booking_id: bookingId,
      user_id:    userId,
      payment_purpose: 'balance',
    },
  });

  logger.info({ bookingId, orderId: order.id, amountInPaise }, 'Razorpay balance order created');

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
 * Verifies the Razorpay balance payment signature and marks the balance as paid.
 *
 * Razorpay signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 */
export async function verifyBalancePayment(params: {
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
  const body     = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

  if (expected !== params.razorpay_signature) {
    logger.warn({ bookingId: params.booking_id }, 'Razorpay balance signature mismatch');
    throw new AppError('Payment verification failed — invalid signature', 400);
  }

  // Confirm booking belongs to this user and has a balance to pay
  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, balance_amount, total_amount, status')
    .eq('id', params.booking_id)
    .maybeSingle();

  if (bookingErr !== null || booking === null) {
    throw new AppError('Booking not found', 404);
  }

  const row = toRecord(booking);
  if (readString(row, 'user_id') !== params.user_id) {
    throw new AppError('Forbidden', 403);
  }

  const balanceAmount = readNumber(row, 'balance_amount');
  const totalAmount   = readNumber(row, 'total_amount');
  if (balanceAmount <= 0) {
    throw new AppError('Balance already paid', 409);
  }

  // Insert payment record
  const { error: paymentErr } = await supabaseAdmin.from('payments').insert({
    booking_id:          params.booking_id,
    user_id:             params.user_id,
    amount:              balanceAmount,
    currency:            'INR',
    status:              'paid',
    payment_method:      'razorpay',
    razorpay_order_id:   params.razorpay_order_id,
    razorpay_payment_id: params.razorpay_payment_id,
    razorpay_signature:  params.razorpay_signature,
  });

  if (paymentErr !== null) {
    logger.error({ err: paymentErr, bookingId: params.booking_id }, 'Failed to insert balance payment record');
    // Non-fatal — booking is still updated below
  }

  // Update booking: balance settled
  const { error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({
      advance_amount: totalAmount,
      balance_amount: 0,
      payment_status: 'paid',
      updated_at:     new Date().toISOString(),
    })
    .eq('id', params.booking_id);

  if (updateErr !== null) {
    logger.error({ err: updateErr, bookingId: params.booking_id }, 'Failed to update booking after balance payment');
    throw new AppError('Payment verified but booking update failed. Contact support.', 500);
  }

  logger.info(
    { bookingId: params.booking_id, paymentId: params.razorpay_payment_id },
    'Razorpay balance payment verified',
  );

  return {
    booking_id: params.booking_id,
    payment_id: params.razorpay_payment_id,
    status:     'paid',
  };
}
