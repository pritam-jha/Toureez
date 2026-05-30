import type { RequestHandler } from 'express';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
// FIXED: 1 - Validate JWTs with the public client, then read roles with the admin client.
import { supabaseAdmin, supabasePublic } from '../lib/supabase';
// FIXED: 2 - Use the shared vendor role constant for the company_owner DB enum.
import { VENDOR_ROLE, type AuthenticatedUser, type UserRole } from '../types';
import { ERROR_MESSAGES } from '../constants/errors';
import { error as errorResponse } from '../utils/response';

const extractBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (authorizationHeader === undefined) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || token === undefined || token.trim() === '') {
    return null;
  }

  return token.trim();
};

const readRole = (value: unknown): UserRole => {
  // FIXED: 2 - Backend role parsing follows the shared company_owner convention.
  return value === VENDOR_ROLE || value === 'admin' ? value : 'traveler';
};

const fetchDatabaseRole = async (userId: string): Promise<UserRole> => {
  // FIXED: 1 - public.users.role is the source of truth for authorization.
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error !== null) {
    throw error;
  }

  return readRole((data as { role?: unknown } | null)?.role);
};

const toAuthenticatedUser = (
  user: SupabaseAuthUser,
  role: UserRole
): AuthenticatedUser => {
  return {
    id: user.id,
    email: user.email ?? '',
    // FIXED: 1 - Attach the database role, never a metadata-derived role.
    role,
  };
};

/**
 * Requires a valid Supabase JWT and attaches the authenticated user to the request.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (token === null) {
      return errorResponse(res, ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    // FIXED: 1 - JWT validation uses the anon client; role lookup uses public.users.
    const { data, error } = await supabasePublic.auth.getUser(token);

    if (error !== null || data.user === null) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, 401);
    }

    const role = await fetchDatabaseRole(data.user.id);
    req.user = toAuthenticatedUser(data.user, role);
    return next();
  } catch (caughtError) {
    return next(caughtError);
  }
};

/**
 * Attaches a Supabase user when a valid JWT is present, while allowing anonymous access.
 */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (token === null) {
      return next();
    }

    // FIXED: 1 - Optional auth still reads the database role when a valid JWT exists.
    const { data, error } = await supabasePublic.auth.getUser(token);

    if (error === null && data.user !== null) {
      const role = await fetchDatabaseRole(data.user.id);
      req.user = toAuthenticatedUser(data.user, role);
    }

    return next();
  } catch (caughtError) {
    return next(caughtError);
  }
};
