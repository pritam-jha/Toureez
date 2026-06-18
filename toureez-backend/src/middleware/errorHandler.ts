import type { ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { IS_PRODUCTION } from '../config';
import { error as errorResponse, validationError } from '../utils/response';
import { logger } from '../utils/logger';
import { Sentry } from '../lib/sentry';

type ZodError = z.ZodError;

const formatZodIssues = (err: ZodError): Array<{ path: string; message: string }> => {
  return err.issues.map((issue: z.ZodIssue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : 'root',
    message: issue.message,
  }));
};

const logError = (err: unknown): void => {
  logger.error({ err }, 'Unhandled error');
};

/**
 * Reports an error to Sentry. Skips client-error AppErrors (4xx) — those are
 * expected control flow (validation failures, not-found, forbidden, etc.)
 * and would just add noise. Genuine 5xx/unexpected errors are always sent.
 * No-ops silently if SENTRY_DSN isn't configured (Sentry.init was never called).
 */
const reportToSentry = (err: unknown): void => {
  if (err instanceof AppError && err.statusCode < 500) {
    return;
  }
  Sentry.captureException(err);
};

/**
 * Converts thrown errors into standardized client-safe API responses.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  logError(err);
  reportToSentry(err);

  if (err instanceof z.ZodError) {
    return validationError(res, formatZodIssues(err));
  }

  if (err instanceof AppError) {
    return errorResponse(
      res,
      err.message,
      err.statusCode,
      IS_PRODUCTION
        ? undefined
        : {
            stack: err.stack,
          },
    );
  }

  if (err instanceof Error && !IS_PRODUCTION) {
    return errorResponse(res, err.message, 500, {
      stack: err.stack,
    });
  }

  return errorResponse(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, 500);
};
