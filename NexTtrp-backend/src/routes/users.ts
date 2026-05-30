import { Router } from 'express';
import { z } from 'zod';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { requireAuth } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
import { getProfile, updateProfile, deleteAccount } from '../services/userService';
import { saveDeviceToken, removeDeviceToken } from '../services/deviceTokenService';
import { success, validationError } from '../utils/response';
import { UpdateProfileSchema } from '../utils/validation';

const DeviceTokenSchema = z
  .object({
    token: z.string().trim().min(1).max(512),
    platform: z.enum(['ios', 'android']),
  })
  .strict();

/**
 * Authenticated user profile routes.
 */
export const usersRouter = Router();

usersRouter.use(defaultLimiter);
usersRouter.use(requireAuth);

/** GET /api/v1/users/profile */
usersRouter.get('/profile', async (req, res, next) => {
  try {
    if (req.user === undefined) throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    const profile = await getProfile(req.user.id);
    return success(res, profile);
  } catch (caughtError) {
    return next(caughtError);
  }
});

/** PATCH /api/v1/users/profile */
usersRouter.patch('/profile', strictLimiter, async (req, res, next) => {
  try {
    if (req.user === undefined) throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    const profileUpdate = UpdateProfileSchema.parse(req.body);
    const profile = await updateProfile(req.user.id, profileUpdate);
    return success(res, profile);
  } catch (caughtError) {
    return next(caughtError);
  }
});

/**
 * POST /api/v1/users/device-token
 * Saves or refreshes the Expo push token for the authenticated user's device.
 */
usersRouter.post('/device-token', strictLimiter, async (req, res, next) => {
  try {
    if (req.user === undefined) throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    const parsed = DeviceTokenSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);
    await saveDeviceToken(req.user.id, parsed.data.token, parsed.data.platform);
    return success(res, { saved: true });
  } catch (caughtError) {
    return next(caughtError);
  }
});

/**
 * DELETE /api/v1/users/device-token
 * Removes a push token on logout so the device stops receiving notifications.
 */
usersRouter.delete('/device-token', strictLimiter, async (req, res, next) => {
  try {
    if (req.user === undefined) throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    const parsed = DeviceTokenSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);
    await removeDeviceToken(parsed.data.token);
    return success(res, { removed: true });
  } catch (caughtError) {
    return next(caughtError);
  }
});

/**
 * DELETE /api/v1/users/account
 * Permanently deletes the authenticated user's account and all their data.
 * Requires confirmation in request body: { confirm: "DELETE" }
 */
usersRouter.delete('/account', strictLimiter, async (req, res, next) => {
  try {
    if (req.user === undefined) throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);

    const body = req.body as { confirm?: unknown };
    if (body.confirm !== 'DELETE') {
      throw new AppError('Send { "confirm": "DELETE" } to permanently delete your account.', 400);
    }

    await deleteAccount(req.user.id);
    return success(res, { deleted: true });
  } catch (caughtError) {
    return next(caughtError);
  }
});
