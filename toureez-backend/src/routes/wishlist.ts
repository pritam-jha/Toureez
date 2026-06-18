import { Router } from 'express';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { requireAuth } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
// FIXED: 6 - Wishlist mutations are now routed through backend service functions.
import {
  addPackageToWishlist,
  getUserWishlist,
  removePackageFromWishlist,
  toggleWishlist,
} from '../services/wishlistService';
import { success } from '../utils/response';
import { ToggleWishlistSchema, UuidParamSchema } from '../utils/validation';

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

wishlistRouter.post('/', strictLimiter, async (req, res, next) => {
  try {
    if (req.user === undefined) {
      throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    // FIXED: 6 - Add wishlist requests validate here before touching Supabase.
    const { package_id: packageId } = ToggleWishlistSchema.parse(req.body);
    const result = await addPackageToWishlist(req.user.id, packageId);
    return success(res, result, 201);
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

wishlistRouter.delete('/:id', strictLimiter, async (req, res, next) => {
  try {
    if (req.user === undefined) {
      throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }

    // FIXED: 6 - Remove wishlist requests go through the backend API.
    const { id: packageId } = UuidParamSchema.parse(req.params);
    const result = await removePackageFromWishlist(req.user.id, packageId);
    return success(res, result);
  } catch (caughtError) {
    return next(caughtError);
  }
});
