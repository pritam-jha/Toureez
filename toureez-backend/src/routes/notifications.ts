import { Router } from 'express';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { requireAuth } from '../middleware/auth';
import { defaultLimiter } from '../middleware/rateLimiter';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationService';
import { success } from '../utils/response';
import { UuidParamSchema } from '../utils/validation';

/**
 * Authenticated notification inbox routes for the current user.
 */
export const notificationsRouter = Router();

notificationsRouter.use(defaultLimiter);
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (req, res, next) => {
  try {
    if (req.user === undefined) {
      throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    const notifications = await getUserNotifications(req.user.id);
    return success(res, notifications);
  } catch (caughtError) {
    return next(caughtError);
  }
});

notificationsRouter.patch('/read-all', async (req, res, next) => {
  try {
    if (req.user === undefined) {
      throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    const result = await markAllNotificationsAsRead(req.user.id);
    return success(res, result);
  } catch (caughtError) {
    return next(caughtError);
  }
});

notificationsRouter.patch('/:id/read', async (req, res, next) => {
  try {
    if (req.user === undefined) {
      throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    const { id } = UuidParamSchema.parse(req.params);
    const notification = await markNotificationAsRead(req.user.id, id);
    return success(res, notification);
  } catch (caughtError) {
    return next(caughtError);
  }
});
