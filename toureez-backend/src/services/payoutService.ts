/**
 * @file services/payoutService.ts
 * @description Vendor payout account and disbursement management.
 *
 * Responsibilities:
 * - CRUD for vendor payout accounts (bank / UPI)
 * - Listing and status-updating vendor payout disbursements
 * - Admin payout dashboard aggregates
 */

import { AppError } from '../constants/errors';
import { supabaseAdmin } from '../lib/supabase';
import type { PaginatedResponse } from '../types';
import {
  isRecord,
  toRecord,
  readString,
  readNullableString,
  readNumber,
  throwDb,
} from '../utils/dbHelpers';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface VendorPayoutAccount {
  id: string;
  company_id: string;
  account_holder_name: string;
  bank_name: string | null;
  /** Last 4 digits of account number (actual column: account_number_last4) */
  account_number_last4: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  company?: { name: string; logo_url: string | null };
}

export interface VendorPayout {
  id: string;
  company_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  period_start: string | null;
  period_end: string | null;
  /** Timestamp when payout was processed/paid (actual column: processed_at) */
  processed_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  company?: { name: string; logo_url: string | null };
}

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapPayout = (row: Record<string, unknown>): VendorPayout => {
  const companyRaw = toRecord(row['company']);
  return {
    id: readString(row, 'id'),
    company_id: readString(row, 'company_id'),
    amount: readNumber(row, 'amount'),
    currency: readString(row, 'currency', 'INR'),
    status: readString(row, 'status', 'pending') as PayoutStatus,
    period_start: readNullableString(row, 'period_start'),
    period_end: readNullableString(row, 'period_end'),
    processed_at: readNullableString(row, 'processed_at'),   // was paid_at
    failure_reason: readNullableString(row, 'failure_reason'),
    metadata: isRecord(row['metadata']) ? (row['metadata'] as Record<string, unknown>) : {},
    created_at: readString(row, 'created_at'),
    updated_at: readString(row, 'updated_at'),
    ...(Object.keys(companyRaw).length > 0
      ? { company: { name: readString(companyRaw, 'name'), logo_url: readNullableString(companyRaw, 'logo_url') } }
      : {}),
  };
};

const mapAccount = (row: Record<string, unknown>): VendorPayoutAccount => {
  const companyRaw = toRecord(row['company']);
  return {
    id: readString(row, 'id'),
    company_id: readString(row, 'company_id'),
    account_holder_name: readString(row, 'account_holder_name'),
    bank_name: readNullableString(row, 'bank_name'),
    account_number_last4: readNullableString(row, 'account_number_last4'),
    ifsc_code: readNullableString(row, 'ifsc_code'),
    upi_id: readNullableString(row, 'upi_id'),
    is_primary: row['is_primary'] === true,
    is_verified: row['is_verified'] === true,
    created_at: readString(row, 'created_at'),
    updated_at: readString(row, 'updated_at'),
    ...(Object.keys(companyRaw).length > 0
      ? { company: { name: readString(companyRaw, 'name'), logo_url: readNullableString(companyRaw, 'logo_url') } }
      : {}),
  };
};

// ── Payout disbursements ──────────────────────────────────────────────────────

export async function listPayouts(params: {
  page: number;
  limit: number;
  status?: PayoutStatus;
  companyId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<PaginatedResponse<VendorPayout>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('vendor_payouts')
    .select('*, company:companies(name, logo_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq('status', params.status);
  if (params.companyId) query = query.eq('company_id', params.companyId);
  if (params.fromDate) query = query.gte('created_at', `${params.fromDate}T00:00:00Z`);
  if (params.toDate) query = query.lte('created_at', `${params.toDate}T23:59:59Z`);

  const { data, error, count } = await query;
  if (error !== null) throwDb('listPayouts', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapPayout(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function getPayoutById(payoutId: string): Promise<VendorPayout> {
  const { data, error } = await supabaseAdmin
    .from('vendor_payouts')
    .select('*, company:companies(name, logo_url)')
    .eq('id', payoutId)
    .maybeSingle();

  if (error !== null) throwDb('getPayoutById', error);
  if (data === null) throw new AppError('Payout not found', 404);
  return mapPayout(toRecord(data));
}

export async function updatePayoutStatus(
  payoutId: string,
  status: PayoutStatus,
  gatewayResponse?: Record<string, unknown>,
): Promise<VendorPayout> {
  const updatePayload: Record<string, unknown> = { status };
  if (status === 'paid') updatePayload['processed_at'] = new Date().toISOString();
  if (gatewayResponse) updatePayload['metadata'] = gatewayResponse;

  const { data, error } = await supabaseAdmin
    .from('vendor_payouts')
    .update(updatePayload)
    .eq('id', payoutId)
    .select('*, company:companies(name, logo_url)')
    .maybeSingle();

  if (error !== null) throwDb('updatePayoutStatus', error);
  if (data === null) throw new AppError('Payout not found', 404);
  return mapPayout(toRecord(data));
}

// ── Payout accounts ───────────────────────────────────────────────────────────

export async function listPayoutAccounts(params: {
  page: number;
  limit: number;
  isPrimary?: boolean;
  isVerified?: boolean;
}): Promise<PaginatedResponse<VendorPayoutAccount>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  // vendor_payout_accounts has no status column; filter by is_primary / is_verified instead.
  let query = supabaseAdmin
    .from('vendor_payout_accounts')
    .select('*, company:companies(name, logo_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.isPrimary !== undefined) query = query.eq('is_primary', params.isPrimary);
  if (params.isVerified !== undefined) query = query.eq('is_verified', params.isVerified);

  const { data, error, count } = await query;
  if (error !== null) throwDb('listPayoutAccounts', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapAccount(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}
