import { Router } from 'express';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { requireAuth } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
import { getUserWishlist, toggleWishlist } from '../services/wishlistService';
import { success } from '../utils/response';
import { ToggleWishlistSchema } from '../utils/validation';

/**
 * Authenticated wishlist routes for the current traveler.
 */
export const wishlistRouter = Router();

wishlistRouter.use(defaultLimiter);
wishlistRouter.use(requireAuth);

wishlistRouter.get('/', async (req, res, next) => {
  try {
    if (req.user === undefined) {
      throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    const wishlist = await getUserWishlist(req.user.id);
    return success(res, wishlist);
  } catch (caughtError) {
    return next(caughtError);
  }
});

wishlistRouter.post('/toggle', strictLimiter, async (req, res, next) => {
  try {
    if (req.user === undefined) {
      throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    const { package_id: packageId } = ToggleWishlistSchema.parse(req.body);
    const result = await toggleWishlist(req.user.id, packageId);
    return success(res, result);
  } catch (caughtError) {
    return next(caughtError);
  }
});
