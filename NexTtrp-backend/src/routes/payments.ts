/**
 * @file routes/payments.ts
 * @description Payment gateway webhooks.
 *
 * POST /api/v1/payments/webhook/razorpay — Razorpay webhook (no auth, raw body)
 *
 * Safety net: if a user's app crashes after payment but before
 * verify-razorpay-payment is called, this webhook confirms the booking.
 */

import crypto from 'crypto';
import express, { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { strictLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { toRecord, readString, readNumber } from '../utils/dbHelpers';

export const paymentsRouter = Router();

paymentsRouter.post(
  '/webhook/razorpay',
  strictLimiter,
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.warn('Razorpay webhook: RAZORPAY_WEBHOOK_SECRET not configured');
        return res.status(200).send('ok');
      }

      const signature = req.headers['x-razorpay-signature'];
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');

      if (expected !== signature) {
        logger.warn('Razorpay webhook: invalid signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = JSON.parse(req.body.toString());

      if (event.event === 'payment.captured') {
        const razorpayPaymentId = event.payload?.payment?.entity?.id;
        const razorpayOrderId = event.payload?.payment?.entity?.order_id;

        if (!razorpayPaymentId || !razorpayOrderId) {
          logger.warn({ event: event.event }, 'Razorpay webhook: missing payment/order id');
          return res.status(200).send('ok');
        }

        // Idempotency: skip if we've already recorded this payment
        const { data: existingPayment } = await supabaseAdmin
          .from('payments')
          .select('id')
          .eq('razorpay_payment_id', razorpayPaymentId)
          .maybeSingle();

        if (existingPayment !== null) {
          return res.status(200).send('ok');
        }

        // Find the booking via the order id
        const { data: orderPayment } = await supabaseAdmin
          .from('payments')
          .select('booking_id')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle();

        const bookingId = orderPayment !== null ? readString(toRecord(orderPayment), 'booking_id') : '';

        if (!bookingId) {
          logger.warn({ razorpayOrderId }, 'Razorpay webhook: booking not found for order');
          return res.status(200).send('ok');
        }

        const { data: bookingData } = await supabaseAdmin
          .from('bookings')
          .select('id, user_id, status, payment_type, total_amount, advance_amount')
          .eq('id', bookingId)
          .maybeSingle();

        if (bookingData === null) {
          logger.warn({ bookingId }, 'Razorpay webhook: booking not found');
          return res.status(200).send('ok');
        }

        const bookingRow = toRecord(bookingData);
        if (readString(bookingRow, 'status') === 'confirmed') {
          return res.status(200).send('ok');
        }

        const paymentType = readString(bookingRow, 'payment_type');
        const amountPaid =
          paymentType === 'advance'
            ? readNumber(bookingRow, 'advance_amount')
            : readNumber(bookingRow, 'total_amount');

        const { error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId);

        if (updateError !== null) {
          logger.error({ err: updateError, bookingId }, 'Razorpay webhook: failed to update booking');
          return res.status(200).send('ok');
        }

        const { error: insertError } = await supabaseAdmin.from('payments').insert({
          booking_id: bookingId,
          user_id: readString(bookingRow, 'user_id'),
          amount: amountPaid,
          payment_method: 'razorpay',
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          status: 'paid',
          currency: 'INR',
        });

        if (insertError !== null) {
          logger.error({ err: insertError, bookingId }, 'Razorpay webhook: failed to insert payment record');
        }

        logger.info({ bookingId, paymentId: razorpayPaymentId }, 'Razorpay webhook: booking confirmed');
        return res.status(200).send('ok');
      }

      logger.info({ event: event.event }, 'Razorpay webhook: unhandled event type');
      return res.status(200).send('ok');
    } catch (err) {
      logger.error({ err }, 'Razorpay webhook: unexpected error');
      return res.status(200).send('ok');
    }
  }
);
