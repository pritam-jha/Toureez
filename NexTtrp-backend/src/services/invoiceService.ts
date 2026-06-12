/**
 * @file services/invoiceService.ts
 * @description Generates a GST-compliant tax invoice PDF for a confirmed booking.
 */

import PDFDocument from 'pdfkit';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../utils/logger';
import { GST_RATE } from './bookingService';

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_NAME = 'NextTrip Travel Technologies Pvt. Ltd.';
const PLATFORM_GSTIN = process.env.PLATFORM_GSTIN ?? '29AABCT1332L000';
const PLATFORM_PAN = process.env.PLATFORM_PAN ?? 'AABCT1332L';
const PLATFORM_ADDRESS = process.env.PLATFORM_ADDRESS ?? 'Kolkata, West Bengal, India';
const HSN_SAC_CODE = '998555';
const INVOICE_PREFIX = 'NT-INV';

const COLOR_BRAND = '#E8631A';
const COLOR_BODY = '#333333';
const COLOR_MUTED = '#666666';
const COLOR_TABLE_HEADER_BG = '#F5F5F5';
const COLOR_RULE = '#DDDDDD';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
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

const readString = (record: Record<string, unknown>, key: string, fallback = ''): string => {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
};

const readNullableString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' ? value : null;
};

const readNumber = (record: Record<string, unknown>, key: string, fallback = 0): number => {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  logger.error({ err: dbError, op: `invoiceService.${operation}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const formatDate = (iso: string | null): string => {
  if (iso === null || iso === '') return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return dateFormatter.format(parsed);
};

const formatCurrency = (amount: number): string => inrFormatter.format(amount);

// ── Invoice generation ───────────────────────────────────────────────────────

export async function generateBookingInvoice(
  userId: string,
  bookingId: string
): Promise<{ buffer: Buffer; filename: string }> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      `
      id,
      booking_reference,
      travel_date,
      num_travelers,
      total_amount,
      advance_amount,
      balance_amount,
      status,
      payment_status,
      primary_contact,
      created_at,
      package:packages!bookings_package_id_fkey(
        title,
        duration_days,
        duration_nights,
        location:locations(city, state)
      ),
      company:companies(name, gst_number, pan_number)
    `
    )
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error !== null) throwDatabaseError('generateBookingInvoice.fetchBooking', error);
  if (data === null) throw new AppError('Booking not found', 404);

  const record = toRecord(data);
  const status = readString(record, 'status');

  if (status !== 'confirmed' && status !== 'completed') {
    throw new AppError('Invoice not available for this booking status', 400);
  }

  const { data: paymentData, error: paymentError } = await supabaseAdmin
    .from('payments')
    .select('amount, payment_method, created_at')
    .eq('booking_id', bookingId)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError !== null) throwDatabaseError('generateBookingInvoice.fetchPayment', paymentError);

  const payment = toRecord(paymentData);
  const pkg = toRecord(record['package']);
  const location = toRecord(pkg['location']);
  const company = toRecord(record['company']);
  const primaryContact = toRecord(record['primary_contact']);

  const totalAmount = readNumber(record, 'total_amount');
  const advanceAmount = readNumber(record, 'advance_amount');
  const balanceAmount = readNumber(record, 'balance_amount');
  const numTravelers = readNumber(record, 'num_travelers', 1);

  const taxableAmount = Math.round(totalAmount / (1 + GST_RATE));
  const gstAmount = totalAmount - taxableAmount;
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  const bookingReference = readString(record, 'booking_reference');
  const last6 = bookingReference.slice(-6);
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const invoiceNumber = `${INVOICE_PREFIX}-${yyyymm}-${last6}`;
  const filename = `NextTrip_Invoice_${invoiceNumber}.pdf`;

  const amountPaid = payment['amount'] !== undefined ? readNumber(payment, 'amount') : advanceAmount;
  const paymentType = balanceAmount > 0 ? 'Advance' : 'Full';
  const paymentMethod = readNullableString(payment, 'payment_method') ?? '—';
  const paidAt = readNullableString(payment, 'created_at');

  const packageTitle = readString(pkg, 'title', 'Travel Package');
  const durationDays = readNumber(pkg, 'duration_days');
  const durationNights = readNumber(pkg, 'duration_nights');
  const city = readString(location, 'city');
  const state = readString(location, 'state');

  const companyName = readString(company, 'name', '—');
  const companyGst = readNullableString(company, 'gst_number') ?? 'Not registered';
  const companyPan = readNullableString(company, 'pan_number') ?? '—';

  const travellerName = readString(primaryContact, 'full_name', '—');
  const travellerPhone = readNullableString(primaryContact, 'phone');

  const unitPrice = numTravelers > 0 ? Math.round(totalAmount / numTravelers) : totalAmount;

  const buffer = await renderInvoicePdf({
    invoiceNumber,
    invoiceDate: formatDate(now.toISOString()),
    travellerName,
    travellerPhone,
    bookingReference,
    companyName,
    companyGst,
    companyPan,
    packageTitle,
    city,
    state,
    durationDays,
    durationNights,
    travelDate: formatDate(readString(record, 'travel_date')),
    numTravelers,
    unitPrice,
    totalAmount,
    taxableAmount,
    cgst,
    sgst,
    paymentType,
    amountPaid,
    balanceAmount,
    paymentMethod,
    paidAt: formatDate(paidAt),
  });

  return { buffer, filename };
}

// ── PDF rendering ────────────────────────────────────────────────────────────

interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string;
  travellerName: string;
  travellerPhone: string | null;
  bookingReference: string;
  companyName: string;
  companyGst: string;
  companyPan: string;
  packageTitle: string;
  city: string;
  state: string;
  durationDays: number;
  durationNights: number;
  travelDate: string;
  numTravelers: number;
  unitPrice: number;
  totalAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  paymentType: string;
  amountPaid: number;
  balanceAmount: number;
  paymentMethod: string;
  paidAt: string;
}

async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const left = doc.page.margins.left;

      // ── Header ──────────────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(22).fillColor(COLOR_BRAND).text('NEXTTRIP', left, doc.y);

      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(13).fillColor(COLOR_BODY).text('TAX INVOICE', left, doc.y, {
        continued: true,
      });
      doc.font('Helvetica').fontSize(10).fillColor(COLOR_MUTED).text(`   Invoice No: ${data.invoiceNumber}`, {
        align: 'right',
      });

      doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED).text(`GSTIN: ${PLATFORM_GSTIN}`, left, doc.y, {
        continued: true,
      });
      doc.text(`   Invoice Date: ${data.invoiceDate}`, { align: 'right' });

      doc.text(PLATFORM_ADDRESS, left, doc.y);
      doc.text(PLATFORM_NAME, left, doc.y);

      doc.moveDown(0.5);
      drawRule(doc, left, pageWidth);
      doc.moveDown(0.5);

      // ── Billed To / Service Provider ────────────────────────────────────────
      const colWidth = pageWidth / 2;
      const sectionTop = doc.y;

      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_BRAND).text('BILLED TO', left, sectionTop);
      doc.font('Helvetica').fontSize(10).fillColor(COLOR_BODY);
      doc.text(data.travellerName, left, doc.y);
      if (data.travellerPhone !== null && data.travellerPhone !== '') {
        doc.fillColor(COLOR_MUTED).text(data.travellerPhone, left, doc.y);
      }
      doc.fillColor(COLOR_MUTED).text(`Booking Ref: ${data.bookingReference}`, left, doc.y);

      const rightColX = left + colWidth;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_BRAND).text('SERVICE PROVIDER', rightColX, sectionTop);
      doc.font('Helvetica').fontSize(10).fillColor(COLOR_BODY);
      doc.text(data.companyName, rightColX, sectionTop + 14);
      doc.fillColor(COLOR_MUTED).text(`GSTIN: ${data.companyGst}`, rightColX, doc.y);
      doc.fillColor(COLOR_MUTED).text(`PAN: ${data.companyPan}`, rightColX, doc.y);

      doc.y = Math.max(doc.y, sectionTop + 70);
      doc.moveDown(0.5);
      drawRule(doc, left, pageWidth);
      doc.moveDown(0.5);

      // ── Line item table ─────────────────────────────────────────────────────
      const tableTop = doc.y;
      const colDescW = pageWidth * 0.46;
      const colQtyW = pageWidth * 0.12;
      const colUnitW = pageWidth * 0.2;
      const colAmountW = pageWidth * 0.22;
      const colQtyX = left + colDescW;
      const colUnitX = colQtyX + colQtyW;
      const colAmountX = colUnitX + colUnitW;

      doc.rect(left, tableTop, pageWidth, 20).fill(COLOR_TABLE_HEADER_BG);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_BODY);
      doc.text('DESCRIPTION', left + 6, tableTop + 6);
      doc.text('QTY', colQtyX, tableTop + 6, { width: colQtyW, align: 'right' });
      doc.text('UNIT PRICE', colUnitX, tableTop + 6, { width: colUnitW, align: 'right' });
      doc.text('AMOUNT', colAmountX, tableTop + 6, { width: colAmountW - 6, align: 'right' });

      let rowY = tableTop + 26;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_BODY).text(data.packageTitle, left + 6, rowY, {
        width: colDescW - 6,
      });
      rowY = doc.y + 2;
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED).text(
        `${data.city}, ${data.state} · ${data.durationNights}N / ${data.durationDays}D`,
        left + 6,
        rowY,
        { width: colDescW - 6 }
      );
      rowY = doc.y + 2;
      doc.fillColor(COLOR_MUTED).text(`Travel Date: ${data.travelDate}`, left + 6, rowY, { width: colDescW - 6 });

      doc.font('Helvetica').fontSize(10).fillColor(COLOR_BODY);
      doc.text(String(data.numTravelers), colQtyX, tableTop + 26, { width: colQtyW, align: 'right' });
      doc.text(formatCurrency(data.unitPrice), colUnitX, tableTop + 26, { width: colUnitW, align: 'right' });
      doc.text(formatCurrency(data.totalAmount), colAmountX, tableTop + 26, {
        width: colAmountW - 6,
        align: 'right',
      });

      doc.y = Math.max(doc.y, rowY + 14);
      doc.moveDown(0.5);
      drawRule(doc, left, pageWidth);
      doc.moveDown(0.5);

      // ── Totals ───────────────────────────────────────────────────────────────
      const totalsLabelX = left + pageWidth - 220;
      const totalsValueW = 220;

      writeTotalRow(doc, totalsLabelX, totalsValueW, 'Taxable Amount:', formatCurrency(data.taxableAmount), false);
      writeTotalRow(doc, totalsLabelX, totalsValueW, 'CGST @ 2.5%:', formatCurrency(data.cgst), false);
      writeTotalRow(doc, totalsLabelX, totalsValueW, 'SGST @ 2.5%:', formatCurrency(data.sgst), false);

      doc.moveDown(0.2);
      drawRule(doc, totalsLabelX, totalsValueW);
      doc.moveDown(0.2);

      writeTotalRow(doc, totalsLabelX, totalsValueW, 'TOTAL:', formatCurrency(data.totalAmount), true);

      doc.moveDown(0.8);
      drawRule(doc, left, pageWidth);
      doc.moveDown(0.5);

      // ── Payment details ─────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_BRAND).text('PAYMENT DETAILS', left, doc.y);
      doc.font('Helvetica').fontSize(10).fillColor(COLOR_BODY);
      doc.text(`Payment Type: ${data.paymentType}`, left, doc.y);
      doc.text(
        `Amount Paid: ${formatCurrency(data.amountPaid)}   |   Balance Due: ${formatCurrency(data.balanceAmount)}`,
        left,
        doc.y
      );
      doc.text(`Payment Method: ${data.paymentMethod}   Paid On: ${data.paidAt}`, left, doc.y);

      doc.moveDown(0.5);
      drawRule(doc, left, pageWidth);
      doc.moveDown(0.5);

      // ── Footer ───────────────────────────────────────────────────────────────
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED);
      doc.text(`HSN/SAC Code: ${HSN_SAC_CODE}`, left, doc.y);
      doc.font('Helvetica-Oblique').text('This is a computer-generated invoice. No signature required.', left, doc.y);
      doc.font('Helvetica').text('For support: support@nexttrip.in', left, doc.y);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawRule(doc: PDFKit.PDFDocument, x: number, width: number): void {
  const y = doc.y;
  doc.save();
  doc.strokeColor(COLOR_RULE).lineWidth(0.5).moveTo(x, y).lineTo(x + width, y).stroke();
  doc.restore();
  doc.moveDown(0.3);
}

function writeTotalRow(
  doc: PDFKit.PDFDocument,
  x: number,
  width: number,
  label: string,
  value: string,
  emphasize: boolean
): void {
  const labelWidth = width * 0.6;
  const valueWidth = width * 0.4;

  doc.font(emphasize ? 'Helvetica-Bold' : 'Helvetica').fontSize(emphasize ? 12 : 10);
  doc.fillColor(emphasize ? COLOR_BRAND : COLOR_BODY);

  const y = doc.y;
  doc.text(label, x, y, { width: labelWidth, align: 'right' });
  doc.text(value, x + labelWidth, y, { width: valueWidth, align: 'right' });
  doc.y = y;
  doc.moveDown(emphasize ? 1.1 : 0.9);
}
