import type { ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { error as errorResponse, validationError } from '../utils/response';
import { logger } from '../utils/logger';

type ZodError = z.ZodError;

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

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
 * Converts thrown errors into standardized client-safe API responses.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  logError(err);

  if (err instanceof z.ZodError) {
    return validationError(res, formatZodIssues(err));
  }

  if (err instanceof AppError) {
    return errorResponse(
      res,
      err.message,
      err.statusCode,
      isProduction()
        ? undefined
        : {
            stack: err.stack,
          },
    );
  }

  if (err instanceof Error && !isProduction()) {
    return errorResponse(res, err.message, 500, {
      stack: err.stack,
    });
  }

  return errorResponse(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, 500);
};
