/**
 * @file utils/dbHelpers.ts
 * @description Shared safe-accessor helpers for PostgREST/Supabase row data.
 *
 * All three service files (adminService, auditLogService, payoutService)
 * previously duplicated these functions. A fix here applies everywhere.
 */

import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { logger } from './logger';

// ── Type guard ─────────────────────────────────────────────────────────────────

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// ── Row coercion ──────────────────────────────────────────────────────────────

/**
 * Coerces an unknown value to a plain object.
 * If the value is an array, the first element is used (handles PostgREST
 * embedding that returns a single-element array for to-one relations).
 */
export const toRecord = (v: unknown): Record<string, unknown> =>
  isRecord(v) ? v : Array.isArray(v) && isRecord(v[0]) ? (v[0] as Record<string, unknown>) : {};

// ── Typed field readers ───────────────────────────────────────────────────────

export const readString = (r: Record<string, unknown>, k: string, fb = ''): string =>
  typeof r[k] === 'string' ? (r[k] as string) : fb;

export const readNullableString = (r: Record<string, unknown>, k: string): string | null =>
  typeof r[k] === 'string' ? (r[k] as string) : null;

export const readNumber = (r: Record<string, unknown>, k: string, fb = 0): number => {
  const v = r[k];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const p = Number.parseFloat(v);
    return Number.isFinite(p) ? p : fb;
  }
  return fb;
};

export const readBoolean = (r: Record<string, unknown>, k: string, fb = false): boolean =>
  typeof r[k] === 'boolean' ? (r[k] as boolean) : fb;

export const readArray = (r: Record<string, unknown>, k: string): unknown[] =>
  Array.isArray(r[k]) ? (r[k] as unknown[]) : [];

// ── Error helper ──────────────────────────────────────────────────────────────

/**
 * Logs a DB error and throws a standardised AppError(500).
 * Pass the fully-qualified operation name, e.g. `'adminService.listUsers'`.
 */
export const throwDb = (op: string, err: unknown): never => {
  // Surface the PostgREST error code + message so it's immediately visible in logs.
  const code    = isRecord(err) ? String(err['code']    ?? '') : '';
  const message = isRecord(err) ? String(err['message'] ?? '') : String(err);
  const details = isRecord(err) ? String(err['details'] ?? '') : '';
  logger.error({ op, code, message, details }, `DB error in ${op}`);

  // In development: include the actual DB error in the HTTP response so the
  // client (app, curl, browser) can see it without digging through logs.
  const clientMsg =
    process.env.NODE_ENV !== 'production'
      ? `[${op}] ${code ? `${code}: ` : ''}${message}${details ? ` — ${details}` : ''}`
      : ERROR_MESSAGES.DATABASE_ERROR;

  throw new AppError(clientMsg, 500);
};
