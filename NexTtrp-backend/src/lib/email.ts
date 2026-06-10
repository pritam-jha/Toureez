/**
 * @file lib/email.ts
 * Transactional email via Resend.
 */

import { Resend } from 'resend';
import { AppError } from '../constants/errors';
import { logger } from '../utils/logger';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

// ── Client ────────────────────────────────────────────────────────────────────

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new AppError('Resend credentials not configured. Set RESEND_API_KEY.', 503);
  }

  return new Resend(apiKey);
}

// ── Booking confirmation email ──────────────────────────────────────────────

export interface BookingConfirmationEmailParams {
  to: string;
  booking_reference: string;
  package_name: string;
  travel_date: string;
  num_travelers: number;
  amount_paid: number;
  payment_type: 'full' | 'advance';
  balance_amount: number;
  company_name: string;
  destination: string;
}

const buildBookingConfirmationHtml = (params: BookingConfirmationEmailParams): string => {
  const paymentTypeLabel = params.payment_type === 'advance' ? 'Advance' : 'Full';

  const balanceNote =
    params.payment_type === 'advance' && params.balance_amount > 0
      ? `<p style="margin: 16px 0 0; padding: 12px 16px; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; color: #9a3412; font-size: 14px;">
           Balance due: <strong>${inrFormatter.format(params.balance_amount)}</strong> — please pay this before your travel date.
         </p>`
      : '';

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">Booking Confirmed!</h1>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
        Your booking reference is:
      </p>
      <p style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 0 0 24px;">
        ${params.booking_reference}
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Package</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${params.package_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Destination</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${params.destination}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Travel date</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${params.travel_date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Travellers</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${params.num_travelers}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Paid</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${inrFormatter.format(params.amount_paid)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Payment type</td>
          <td style="padding: 8px 0; text-align: right;">${paymentTypeLabel}</td>
        </tr>
      </table>
      ${balanceNote}
      <p style="font-size: 13px; color: #9ca3af; margin: 32px 0 0;">
        Booked with ${params.company_name} via NextTrip.
      </p>
    </div>
  `;
};

/**
 * Sends a booking confirmation email. Failures are logged but never thrown —
 * email delivery must never block the payment confirmation flow.
 */
export async function sendBookingConfirmationEmail(params: BookingConfirmationEmailParams): Promise<void> {
  try {
    const resend = getResend();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'bookings@nexttrip.in';

    await resend.emails.send({
      from: `NextTrip <${fromEmail}>`,
      to: params.to,
      subject: `Booking Confirmed — ${params.booking_reference}`,
      html: buildBookingConfirmationHtml(params),
    });
  } catch (err) {
    logger.error({ err, to: params.to, bookingReference: params.booking_reference }, 'Failed to send booking confirmation email');
  }
}
