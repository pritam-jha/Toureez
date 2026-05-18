import { Router } from 'express';
import { defaultLimiter } from '../middleware/rateLimiter';
import { getCategories } from '../services/categoryService';
import { success } from '../utils/response';

/**
 * Public category lookup routes.
 */
export const categoriesRouter = Router();

categoriesRouter.use(defaultLimiter);

categoriesRouter.get('/', async (_req, res, next) => {
  try {
    const categories = await getCategories();
    return success(res, categories);
  } catch (caughtError) {
    return next(caughtError);
  }
});
