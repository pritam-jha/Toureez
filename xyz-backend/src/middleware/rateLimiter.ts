import rateLimit, { type Options } from 'express-rate-limit';
import { ERROR_MESSAGES } from '../constants/errors';
import { error as errorResponse } from '../utils/response';

const parsePositiveIntegerEnv = (key: string, fallback: number): number => {
  const value = process.env[key];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const windowMs = parsePositiveIntegerEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
const defaultMax = parsePositiveIntegerEnv('RATE_LIMIT_MAX', 100);

const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return errorResponse(res, ERROR_MESSAGES.RATE_LIMITED, 429);
  },
};

/**
 * Default route-group limiter for regular read-heavy API traffic.
 */
export const defaultLimiter = rateLimit({
  ...baseOptions,
  windowMs,
  limit: defaultMax,
});

/**
 * Strict route-group limiter for write operations and abuse-sensitive endpoints.
 */
export const strictLimiter = rateLimit({
  ...baseOptions,
  windowMs,
  limit: 20,
});
