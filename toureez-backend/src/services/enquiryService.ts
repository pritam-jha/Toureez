/**
 * @file services/enquiryService.ts
 * @description Enquiry threads between travelers and vendors.
 *
 * An enquiry lets a traveler ask a vendor about a package without either
 * side seeing the other's email/phone — all messages are relayed through
 * the platform and tied to the authenticated user IDs only.
 */

import { supabaseAdmin } from '../lib/supabase';
import { AppError } from '../constants/errors';
import { toRecord, readString, readNullableString, readNumber, throwDb } from '../utils/dbHelpers';
import { resolveCompanyId } from './vendorPackageService';
import type { CreateEnquiryInput, EnquiryDetail, EnquiryMessage, EnquirySummary } from '../types';

const ENQUIRY_SELECT = `
  id,
  subject,
  status,
  last_message_preview,
  last_message_at,
  user_unread_count,
  vendor_unread_count,
  created_at,
  package:packages(id, title),
  company:companies(id, name)
`;

const PREVIEW_LENGTH = 140;

function mapSummary(row: Record<string, unknown>, unreadCount: number): EnquirySummary {
  const pkg = toRecord(row['package']);
  const company = toRecord(row['company']);

  return {
    id: readString(row, 'id'),
    package: pkg['id'] != null ? { id: readString(pkg, 'id'), title: readString(pkg, 'title') } : null,
    company: { id: readString(company, 'id'), name: readString(company, 'name') },
    subject: readString(row, 'subject'),
    status: readString(row, 'status') === 'closed' ? 'closed' : 'open',
    last_message_preview: readNullableString(row, 'last_message_preview'),
    last_message_at: readString(row, 'last_message_at'),
    unread_count: unreadCount,
    created_at: readString(row, 'created_at'),
  };
}

function mapMessage(row: Record<string, unknown>): EnquiryMessage {
  return {
    id: readString(row, 'id'),
    sender_role: readString(row, 'sender_role') === 'vendor' ? 'vendor' : 'user',
    message: readString(row, 'message'),
    created_at: readString(row, 'created_at'),
  };
}

function preview(message: string): string {
  const trimmed = message.trim();
  return trimmed.length > PREVIEW_LENGTH ? `${trimmed.slice(0, PREVIEW_LENGTH - 1)}…` : trimmed;
}

async function fetchMessages(enquiryId: string): Promise<EnquiryMessage[]> {
  const { data, error } = await supabaseAdmin
    .from('enquiry_messages')
    .select('id, sender_role, message, created_at')
    .eq('enquiry_id', enquiryId)
    .order('created_at', { ascending: true });

  if (error !== null) throwDb('enquiryService.fetchMessages', error);
  return ((data as unknown[] | null) ?? []).map((row) => mapMessage(toRecord(row)));
}

// ── Traveler-facing ──────────────────────────────────────────────────────────

/**
 * Creates a new enquiry for a package and posts the traveler's opening message.
 */
export async function createEnquiry(userId: string, input: CreateEnquiryInput): Promise<EnquiryDetail> {
  const { data: pkg, error: pkgErr } = await supabaseAdmin
    .from('packages')
    .select('id, title, company_id')
    .eq('id', input.package_id)
    .maybeSingle();

  if (pkgErr !== null) throwDb('createEnquiry.fetchPackage', pkgErr);
  if (pkg === null) throw new AppError('Package not found', 404);

  const pkgRow = toRecord(pkg);
  const companyId = readString(pkgRow, 'company_id');
  const message = input.message.trim();

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('enquiries')
    .insert({
      user_id: userId,
      company_id: companyId,
      package_id: input.package_id,
      subject: `Enquiry about ${readString(pkgRow, 'title')}`,
      last_message_preview: preview(message),
      last_message_at: new Date().toISOString(),
      vendor_unread_count: 1,
    })
    .select('id')
    .single();

  if (insertErr !== null) throwDb('createEnquiry.insert', insertErr);
  const enquiryId = readString(toRecord(inserted), 'id');

  const { error: messageErr } = await supabaseAdmin.from('enquiry_messages').insert({
    enquiry_id: enquiryId,
    sender_id: userId,
    sender_role: 'user',
    message,
  });

  if (messageErr !== null) throwDb('createEnquiry.insertMessage', messageErr);

  return getUserEnquiryDetail(userId, enquiryId);
}

/**
 * Returns all enquiry threads started by this traveler, newest activity first.
 */
export async function getUserEnquiries(userId: string): Promise<EnquirySummary[]> {
  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .select(ENQUIRY_SELECT)
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false });

  if (error !== null) throwDb('getUserEnquiries', error);

  return ((data as unknown[] | null) ?? []).map((row) => {
    const record = toRecord(row);
    return mapSummary(record, readNumber(record, 'user_unread_count'));
  });
}

/**
 * Returns a single enquiry thread with all messages, and marks it read for the traveler.
 */
export async function getUserEnquiryDetail(userId: string, enquiryId: string): Promise<EnquiryDetail> {
  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .select(ENQUIRY_SELECT)
    .eq('id', enquiryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error !== null) throwDb('getUserEnquiryDetail', error);
  if (data === null) throw new AppError('Enquiry not found', 404);

  const row = toRecord(data);

  if (readNumber(row, 'user_unread_count') > 0) {
    const { error: updateErr } = await supabaseAdmin
      .from('enquiries')
      .update({ user_unread_count: 0 })
      .eq('id', enquiryId);
    if (updateErr !== null) throwDb('getUserEnquiryDetail.markRead', updateErr);
  }

  const messages = await fetchMessages(enquiryId);
  return { ...mapSummary(row, 0), messages };
}

/**
 * Posts a follow-up message from the traveler and notifies the vendor side.
 */
export async function addUserMessage(userId: string, enquiryId: string, message: string): Promise<EnquiryDetail> {
  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .select('id, vendor_unread_count')
    .eq('id', enquiryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error !== null) throwDb('addUserMessage.fetch', error);
  if (data === null) throw new AppError('Enquiry not found', 404);

  const row = toRecord(data);
  const trimmed = message.trim();

  const { error: insertErr } = await supabaseAdmin.from('enquiry_messages').insert({
    enquiry_id: enquiryId,
    sender_id: userId,
    sender_role: 'user',
    message: trimmed,
  });
  if (insertErr !== null) throwDb('addUserMessage.insert', insertErr);

  const { error: updateErr } = await supabaseAdmin
    .from('enquiries')
    .update({
      status: 'open',
      last_message_preview: preview(trimmed),
      last_message_at: new Date().toISOString(),
      vendor_unread_count: readNumber(row, 'vendor_unread_count') + 1,
    })
    .eq('id', enquiryId);
  if (updateErr !== null) throwDb('addUserMessage.update', updateErr);

  return getUserEnquiryDetail(userId, enquiryId);
}

// ── Vendor-facing ────────────────────────────────────────────────────────────

/**
 * Returns all enquiry threads addressed to this vendor's company, newest activity first.
 */
export async function getVendorEnquiries(ownerId: string): Promise<EnquirySummary[]> {
  const companyId = await resolveCompanyId(ownerId);

  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .select(ENQUIRY_SELECT)
    .eq('company_id', companyId)
    .order('last_message_at', { ascending: false });

  if (error !== null) throwDb('getVendorEnquiries', error);

  return ((data as unknown[] | null) ?? []).map((row) => {
    const record = toRecord(row);
    return mapSummary(record, readNumber(record, 'vendor_unread_count'));
  });
}

/**
 * Returns a single enquiry thread with all messages, and marks it read for the vendor.
 */
export async function getVendorEnquiryDetail(ownerId: string, enquiryId: string): Promise<EnquiryDetail> {
  const companyId = await resolveCompanyId(ownerId);

  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .select(ENQUIRY_SELECT)
    .eq('id', enquiryId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error !== null) throwDb('getVendorEnquiryDetail', error);
  if (data === null) throw new AppError('Enquiry not found', 404);

  const row = toRecord(data);

  if (readNumber(row, 'vendor_unread_count') > 0) {
    const { error: updateErr } = await supabaseAdmin
      .from('enquiries')
      .update({ vendor_unread_count: 0 })
      .eq('id', enquiryId);
    if (updateErr !== null) throwDb('getVendorEnquiryDetail.markRead', updateErr);
  }

  const messages = await fetchMessages(enquiryId);
  return { ...mapSummary(row, 0), messages };
}

/**
 * Posts a reply from the vendor and notifies the traveler side.
 */
export async function addVendorMessage(ownerId: string, enquiryId: string, message: string): Promise<EnquiryDetail> {
  const companyId = await resolveCompanyId(ownerId);

  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .select('id, user_unread_count')
    .eq('id', enquiryId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error !== null) throwDb('addVendorMessage.fetch', error);
  if (data === null) throw new AppError('Enquiry not found', 404);

  const row = toRecord(data);
  const trimmed = message.trim();

  const { error: insertErr } = await supabaseAdmin.from('enquiry_messages').insert({
    enquiry_id: enquiryId,
    sender_id: ownerId,
    sender_role: 'vendor',
    message: trimmed,
  });
  if (insertErr !== null) throwDb('addVendorMessage.insert', insertErr);

  const { error: updateErr } = await supabaseAdmin
    .from('enquiries')
    .update({
      status: 'open',
      last_message_preview: preview(trimmed),
      last_message_at: new Date().toISOString(),
      user_unread_count: readNumber(row, 'user_unread_count') + 1,
    })
    .eq('id', enquiryId);
  if (updateErr !== null) throwDb('addVendorMessage.update', updateErr);

  return getVendorEnquiryDetail(ownerId, enquiryId);
}

/**
 * Closes an enquiry thread from the vendor side (e.g. once resolved).
 */
export async function setVendorEnquiryStatus(
  ownerId: string,
  enquiryId: string,
  status: 'open' | 'closed',
): Promise<EnquiryDetail> {
  const companyId = await resolveCompanyId(ownerId);

  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .select('id')
    .eq('id', enquiryId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error !== null) throwDb('setVendorEnquiryStatus.fetch', error);
  if (data === null) throw new AppError('Enquiry not found', 404);

  const { error: updateErr } = await supabaseAdmin
    .from('enquiries')
    .update({ status })
    .eq('id', enquiryId);
  if (updateErr !== null) throwDb('setVendorEnquiryStatus.update', updateErr);

  return getVendorEnquiryDetail(ownerId, enquiryId);
}
