/**
 * @file lib/api/client.ts
 * @description Typed HTTP client for the XYZ Node.js/Express backend.
 *
 * Wraps fetch with:
 * - Automatic JSON serialisation / deserialisation
 * - Query parameter building
 * - Bearer token injection from the Supabase session
 * - Consistent ApiResponse<T> return shape — never throws
 *
 * All lib/api/* files that talk to the backend import from this file.
 * Supabase calls continue to use lib/supabase.ts directly.
 */

import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../supabase';
import type { BackendApiResponse } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUrl(endpoint: string, params?: QueryParams): string {
  const base = Config.apiBaseUrl.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${base}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function getAuthHeader(): Record<string, string> {
  const session = useAuthStore.getState().session;
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

// ── Core request ──────────────────────────────────────────────────────────────

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  options: {
    params?: QueryParams;
    body?: unknown;
    auth?: boolean;
  } = {}
): Promise<BackendApiResponse<T>> {
  try {
    const url = buildUrl(endpoint, options.params);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.auth !== false ? getAuthHeader() : {}),
    };

    let body: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const response = await fetch(url, { method, headers, body });

    // Parse response body
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text.trim() ? JSON.parse(text) : undefined;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      // Extract top-level error message
      const message =
        typeof parsed === 'object' &&
        parsed !== null &&
        'error' in parsed &&
        typeof (parsed as Record<string, unknown>).error === 'string'
          ? (parsed as { error: string }).error
          : `Request failed with status ${response.status}`;

      // Extract and append validation details so callers can show them
      let fullMessage = message;
      if (typeof parsed === 'object' && parsed !== null && 'details' in parsed) {
        const details = (parsed as Record<string, unknown>).details;
        console.error('[apiClient] Validation details:', JSON.stringify(details, null, 2));
        fullMessage = `${message}\n\n${JSON.stringify(details, null, 2)}`;
      }

      // Auto sign-out on 401 — token expired or invalid
      if (response.status === 401) {
        void supabase.auth.signOut().then(() => {
          useAuthStore.getState().clearUser();
        });
      }

      return { success: false, data: null, error: fullMessage };
    }

    // Backend always wraps in { success, data, error }
    const envelope = parsed as BackendApiResponse<T>;
    return envelope;
  } catch (err) {
    return {
      success: false,
      data: null,
      error: extractErrorMessage(err),
    };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(endpoint: string, params?: QueryParams, auth = false) =>
    request<T>('GET', endpoint, { params, auth }),

  post: <T>(endpoint: string, body?: unknown, auth = true) =>
    request<T>('POST', endpoint, { body, auth }),

  patch: <T>(endpoint: string, body?: unknown, auth = true) =>
    request<T>('PATCH', endpoint, { body, auth }),

  delete: <T>(endpoint: string, auth = true) =>
    request<T>('DELETE', endpoint, { auth }),
};
