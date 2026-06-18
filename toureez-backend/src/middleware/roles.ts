import type { RequestHandler } from 'express';
import { ERROR_MESSAGES } from '../constants/errors';
import { error as errorResponse } from '../utils/response';

// FIXED: 1 - Composable role guard for protected admin/vendor routes.
export const requireRole = (roles: readonly string[]): RequestHandler => {
  return (req, res, next) => {
    if (req.user === undefined) {
      return errorResponse(res, ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, ERROR_MESSAGES.FORBIDDEN, 403);
    }

    return next();
  };
};
