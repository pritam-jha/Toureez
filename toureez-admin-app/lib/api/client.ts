/**
 * @file lib/api/client.ts
 * Typed HTTP client — auto-injects Bearer token, attempts token refresh on 401
 * before signing the user out.
 */
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../supabase';
import type { BackendApiResponse } from '../../types';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildUrl(endpoint: string, params?: QueryParams): string {
  const base = Config.apiBaseUrl.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function getAuthHeader(): Record<string, string> {
  const session = useAuthStore.getState().session;
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

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
  const { user } = data;
  if (user) {
    const profile = useAuthStore.getState().user;
    if (profile) useAuthStore.getState().setSession(profile, data.session);
  }

  // Retry the original request with the refreshed token
  const retryHeaders = {
    ...init.headers as Record<string, string>,
    Authorization: `Bearer ${data.session.access_token}`,
  };

  try {
    const retryResponse = await fetch(url, { ...init, headers: retryHeaders });
    const retryText = await retryResponse.text();
    let retryParsed: unknown;
    try { retryParsed = retryText.trim() ? JSON.parse(retryText) : undefined; } catch { retryParsed = retryText; }

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

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  options: { params?: QueryParams; body?: unknown } = {},
): Promise<BackendApiResponse<T>> {
  try {
    const url = buildUrl(endpoint, options.params);
    const headers: Record<string, string> = { Accept: 'application/json', ...getAuthHeader() };

    let body: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const init: RequestInit = { method, headers, body };
    const response = await fetch(url, init);
    const text = await response.text();
    let parsed: unknown;
    try { parsed = text.trim() ? JSON.parse(text) : undefined; } catch { parsed = text; }

    if (!response.ok) {
      const message =
        typeof parsed === 'object' && parsed !== null && 'error' in parsed &&
        typeof (parsed as Record<string, unknown>).error === 'string'
          ? (parsed as { error: string }).error
          : `Request failed with status ${response.status}`;

      if (response.status === 401) {
        // Attempt one silent token refresh before signing out
        const retryResult = await handleUnauthorized<T>(method, url, init);
        if (retryResult !== null) return retryResult;
        return { success: false, data: null, error: 'Session expired. Please sign in again.' };
      }

      return { success: false, data: null, error: message };
    }

    return parsed as BackendApiResponse<T>;
  } catch (err) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export const apiClient = {
  get: <T>(endpoint: string, params?: QueryParams) =>
    request<T>('GET', endpoint, { params }),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>('POST', endpoint, { body }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>('PATCH', endpoint, { body }),
  delete: <T>(endpoint: string) =>
    request<T>('DELETE', endpoint),
};
