import type { Response } from 'express';
import type { ApiResponse } from '../types';
import { ERROR_MESSAGES } from '../constants/errors';

/**
 * Sends a successful API response using the shared response envelope.
 */
export const success = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response<ApiResponse<T>> => {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    ...(meta !== undefined ? { meta } : {}),
  };

  return res.status(statusCode).json(body);
};

/**
 * Sends a failed API response using a client-safe message.
 */
export const error = (
  res: Response,
  message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
  statusCode = 500,
  meta?: Record<string, unknown>,
): Response<ApiResponse<null>> => {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: message,
    ...(meta !== undefined ? { meta } : {}),
  };

  return res.status(statusCode).json(body);
};

/**
 * Sends a standardized not-found response for a missing entity.
 */
export const notFound = (res: Response, entity = 'Resource'): Response<ApiResponse<null>> => {
  return error(res, `${entity} not found`, 404);
};

/**
 * Sends a standardized validation failure response with structured validation details.
 */
export const validationError = (
  res: Response,
  details: unknown,
): Response<ApiResponse<null> & { details: unknown }> => {
  return res.status(400).json({
    success: false,
    data: null,
    error: ERROR_MESSAGES.VALIDATION_FAILED,
    details,
  });
};
