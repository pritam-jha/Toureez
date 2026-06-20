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

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  options: { params?: QueryParams; body?: unknown; auth?: boolean } = {}
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

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text.trim() ? JSON.parse(text) : undefined;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      const message =
        typeof parsed === 'object' && parsed !== null && 'error' in parsed &&
        typeof (parsed as Record<string, unknown>).error === 'string'
          ? (parsed as { error: string }).error
          : `Request failed with status ${response.status}`;

      if (response.status === 401) {
        void supabase.auth.signOut().then(() => {
          useAuthStore.getState().clearUser();
        });
      }

      return { success: false, data: null, error: message };
    }

    return parsed as BackendApiResponse<T>;
  } catch (err) {
    return { success: false, data: null, error: extractErrorMessage(err) };
  }
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

/** Backend list endpoints return {items, total, ...} — flattens that to a plain array for screens that just need the list. */
export async function unwrapItems<T>(
  promise: Promise<BackendApiResponse<Paginated<T>>>
): Promise<BackendApiResponse<T[]>> {
  const res = await promise;
  if (res.error || !res.data) return { success: res.success, data: null, error: res.error };
  return { success: res.success, data: res.data.items, error: null };
}

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
