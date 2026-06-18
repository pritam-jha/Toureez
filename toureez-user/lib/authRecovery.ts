/**
 * Helpers for Supabase password-recovery deep links.
 */

export interface RecoveryLinkParams {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  errorDescription?: string;
  hasCredentials: boolean;
  hasRecoveryMarker: boolean;
}

export function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseRecoveryLink(url: string | null | undefined): RecoveryLinkParams {
  if (!url) {
    return { hasCredentials: false, hasRecoveryMarker: false };
  }

  try {
    const parsed = new URL(url);
    const hashParams = new URLSearchParams(
      parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash
    );

    const code = parsed.searchParams.get('code') ?? hashParams.get('code') ?? undefined;
    const accessToken =
      parsed.searchParams.get('access_token') ?? hashParams.get('access_token') ?? undefined;
    const refreshToken =
      parsed.searchParams.get('refresh_token') ?? hashParams.get('refresh_token') ?? undefined;
    const error = parsed.searchParams.get('error') ?? hashParams.get('error') ?? undefined;
    const errorDescription =
      parsed.searchParams.get('error_description') ??
      hashParams.get('error_description') ??
      undefined;
    const type = parsed.searchParams.get('type') ?? hashParams.get('type');
    const path = `${parsed.hostname}${parsed.pathname}`;

    return {
      code,
      accessToken,
      refreshToken,
      error,
      errorDescription,
      hasCredentials: Boolean(code || (accessToken && refreshToken)),
      hasRecoveryMarker: type === 'recovery' || path.includes('reset-password'),
    };
  } catch {
    return { hasCredentials: false, hasRecoveryMarker: false };
  }
}
