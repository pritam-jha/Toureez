import { Router } from 'express';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { requireAuth } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
import { getProfile, updateProfile } from '../services/userService';
import { success } from '../utils/response';
import { UpdateProfileSchema } from '../utils/validation';

/**
 * Authenticated user profile routes.
 */
export const usersRouter = Router();

usersRouter.use(defaultLimiter);
usersRouter.use(requireAuth);

usersRouter.get('/profile', async (req, res, next) => {
  try {
    if (req.user === undefined) {
      throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    const profile = await getProfile(req.user.id);
    return success(res, profile);
  } catch (caughtError) {
    return next(caughtError);
  }
});

usersRouter.patch('/profile', strictLimiter, async (req, res, next) => {
  try {
    if (req.user === undefined) {
      throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    const profileUpdate = UpdateProfileSchema.parse(req.body);
    const profile = await updateProfile(req.user.id, profileUpdate);
    return success(res, profile);
  } catch (caughtError) {
    return next(caughtError);
  }
});
