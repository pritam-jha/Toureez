/**
 * @file services/auditLogService.ts
 * @description Immutable audit trail for all admin mutations.
 *
 * Every admin action that changes data must call logAdminAction().
 * Logs are never hard-deleted; they are append-only.
 *
 * Entity types (by convention):
 *  'user', 'vendor', 'package', 'booking', 'review',
 *  'category', 'location', 'payout', 'payout_account'
 */

import { AppError } from '../constants/errors';
import { supabaseAdmin } from '../lib/supabase';
import type { PaginatedResponse } from '../types';
import { isRecord, toRecord, readString, readNullableString } from '../utils/dbHelpers';
import { logger } from '../utils/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin?: {
    full_name: string | null;
    email: string;
  };
}

export interface LogAdminActionInput {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

const mapAuditLog = (row: Record<string, unknown>): AuditLog => {
  const adminRaw = toRecord(row['admin']);
  return {
    id: readString(row, 'id'),
    // Actual DB column is actor_user_id; surface as admin_id to keep the API contract stable.
    admin_id: readString(row, 'actor_user_id'),
    action: readString(row, 'action'),
    entity_type: readString(row, 'entity_type'),
    entity_id: readNullableString(row, 'entity_id'),
    metadata: isRecord(row['metadata']) ? (row['metadata'] as Record<string, unknown>) : {},
    created_at: readString(row, 'created_at'),
    ...(Object.keys(adminRaw).length > 0
      ? {
          admin: {
            full_name: readNullableString(adminRaw, 'full_name'),
            email: readString(adminRaw, 'email'),
          },
        }
      : {}),
  };
};

// ── Service functions ─────────────────────────────────────────────────────────

/** Waits for `ms` milliseconds (non-blocking). */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Appends one audit log record, with up to MAX_RETRIES attempts using
 * exponential back-off.  Errors are logged but never thrown so they
 * cannot break the calling mutation.
 */
export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  const MAX_RETRIES = 3;
  const payload = {
    actor_user_id: input.adminId,   // actual DB column name
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { error } = await supabaseAdmin.from('admin_audit_logs').insert(payload);

      if (error === null) return; // success

      logger.error({ err: error, attempt, maxRetries: MAX_RETRIES }, 'logAdminAction DB error');
    } catch (err) {
      logger.error({ err, attempt, maxRetries: MAX_RETRIES }, 'logAdminAction unexpected error');
    }

    if (attempt < MAX_RETRIES) {
      // Exponential back-off: 200 ms, 400 ms
      await delay(200 * attempt);
    }
  }

  logger.error({ payload }, 'logAdminAction all retries exhausted — audit record lost');
}

/**
 * Returns paginated audit logs with admin user info, newest first.
 * Supports filtering by admin, entity type/id, action prefix, and date range.
 */
export async function getAuditLogs(params: {
  page: number;
  limit: number;
  adminId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<PaginatedResponse<AuditLog>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.adminId) query = query.eq('actor_user_id', params.adminId);
  if (params.entityType) query = query.eq('entity_type', params.entityType);
  if (params.entityId) query = query.eq('entity_id', params.entityId);
  if (params.action) query = query.ilike('action', `${params.action}%`);
  if (params.fromDate) query = query.gte('created_at', `${params.fromDate}T00:00:00Z`);
  if (params.toDate) query = query.lte('created_at', `${params.toDate}T23:59:59Z`);

  const { data, error, count } = await query;

  if (error !== null) {
    logger.error({ err: error }, 'getAuditLogs DB error');
    throw new AppError('Unable to fetch audit logs', 500);
  }

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  const actorIds = Array.from(
    new Set(
      rows
        .map((r) => readString(toRecord(r), 'actor_user_id'))
        .filter((id) => id.length > 0),
    ),
  );

  const adminById = new Map<string, Record<string, unknown>>();
  if (actorIds.length > 0) {
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .in('id', actorIds);

    if (adminsError !== null) {
      logger.error({ err: adminsError }, 'getAuditLogs failed to fetch admin users');
    } else {
      ((admins as unknown[] | null) ?? []).forEach((admin) => {
        const record = toRecord(admin);
        const id = readString(record, 'id');
        if (id.length > 0) adminById.set(id, record);
      });
    }
  }

  return {
    items: rows.map((r) => {
      const record = toRecord(r);
      const admin = adminById.get(readString(record, 'actor_user_id'));
      return mapAuditLog(admin ? { ...record, admin } : record);
    }),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}
