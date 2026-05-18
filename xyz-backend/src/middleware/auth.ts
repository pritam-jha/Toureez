import type { RequestHandler } from 'express';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthenticatedUser } from '../types';
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

const getStringMetadataValue = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
};

const toAuthenticatedUser = (user: SupabaseAuthUser): AuthenticatedUser => {
  const appMetadataRole = getStringMetadataValue(user.app_metadata.role);
  const userMetadataRole = getStringMetadataValue(user.user_metadata.role);

  return {
    id: user.id,
    email: user.email ?? '',
    role: appMetadataRole ?? userMetadataRole ?? 'authenticated',
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

    const { data, error } = await supabase.auth.getUser(token);

    if (error !== null || data.user === null) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, 401);
    }

    req.user = toAuthenticatedUser(data.user);
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

    const { data, error } = await supabase.auth.getUser(token);

    if (error === null && data.user !== null) {
      req.user = toAuthenticatedUser(data.user);
    }

    return next();
  } catch (caughtError) {
    return next(caughtError);
  }
};
