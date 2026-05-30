/**
 * @file lib/api/client.ts
 * @description Typed HTTP client for the NEXTTRP Node.js/Express backend.
 *
 * Wraps fetch with:
 * - Automatic JSON serialisation / deserialisation
 * - Query parameter building
 * - Bearer token injection from the Supabase session
 * - Silent token refresh on 401 (one retry before sign-out)
 * - Consistent BackendApiResponse<T> return shape — never throws
 *
 * All lib/api/* files that talk to the backend import from this file.
 * Supabase calls continue to use lib/supabase.ts directly.
 */

import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../supabase';
import type { BackendApiResponse } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

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

// ── Token refresh on 401 ──────────────────────────────────────────────────────

/**
 * Attempts to refresh the Supabase session and retry the original fetch once.
 * If refresh fails the user is signed out.
 * Returns null if the retry also fails or if refresh itself failed.
 */
async function handleUnauthorized<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  init: RequestInit,
): Promise<BackendApiResponse<T> | null> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    // Refresh failed — session is truly expired, sign out
    await supabase.auth.signOut();
    useAuthStore.getState().clearUser();
    return null;
  }

  // Update the store with the new session so subsequent calls use the fresh token
  const profile = useAuthStore.getState().user;
  if (profile) {
    useAuthStore.getState().setSession(profile, data.session);
  }

  // Retry the original request with the refreshed token
  const retryHeaders = {
    ...(init.headers as Record<string, string>),
    Authorization: `Bearer ${data.session.access_token}`,
  };

  try {
    const retryResponse = await fetch(url, { ...init, headers: retryHeaders });
    const retryText = await retryResponse.text();
    let retryParsed: unknown;
    try {
      retryParsed = retryText.trim() ? JSON.parse(retryText) : undefined;
    } catch {
      retryParsed = retryText;
    }

    if (!retryResponse.ok) {
      // Still failing after refresh — sign out
      await supabase.auth.signOut();
      useAuthStore.getState().clearUser();
      return null;
    }

    return retryParsed as BackendApiResponse<T>;
  } catch {
    return null;
  }
}

// ── Core request ──────────────────────────────────────────────────────────────

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  options: {
    params?: QueryParams;
    body?: unknown;
    auth?: boolean;
  } = {},
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

    const init: RequestInit = { method, headers, body };
    const response = await fetch(url, init);

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text.trim() ? JSON.parse(text) : undefined;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      const message =
        typeof parsed === 'object' &&
        parsed !== null &&
        'error' in parsed &&
        typeof (parsed as Record<string, unknown>).error === 'string'
          ? (parsed as { error: string }).error
          : `Request failed with status ${response.status}`;

      let fullMessage = message;
      if (typeof parsed === 'object' && parsed !== null && 'details' in parsed) {
        const details = (parsed as Record<string, unknown>).details;
        fullMessage = `${message}\n\n${JSON.stringify(details, null, 2)}`;
      }

      if (response.status === 401) {
        // Attempt one silent token refresh before signing out
        const retryResult = await handleUnauthorized<T>(method, url, init);
        if (retryResult !== null) return retryResult;
        return { success: false, data: null, error: 'Session expired. Please sign in again.' };
      }

      return { success: false, data: null, error: fullMessage };
    }

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
  get: <T>(endpoint: string, params?: QueryParams, auth = true) =>
    request<T>('GET', endpoint, { params, auth }),

  post: <T>(endpoint: string, body?: unknown, auth = true) =>
    request<T>('POST', endpoint, { body, auth }),

  patch: <T>(endpoint: string, body?: unknown, auth = true) =>
    request<T>('PATCH', endpoint, { body, auth }),

  delete: <T>(endpoint: string, auth = true) =>
    request<T>('DELETE', endpoint, { auth }),
};
