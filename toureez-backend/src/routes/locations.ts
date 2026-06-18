import { Router } from 'express';
import { defaultLimiter } from '../middleware/rateLimiter';
import { getLocations } from '../services/locationService';
import { success } from '../utils/response';
import { LocationsQuerySchema } from '../utils/validation';

/**
 * Public location lookup routes.
 */
export const locationsRouter = Router();

locationsRouter.use(defaultLimiter);

locationsRouter.get('/', async (req, res, next) => {
  try {
    const { popular } = LocationsQuerySchema.parse(req.query);
    const locations = await getLocations(popular);
    return success(res, locations);
  } catch (caughtError) {
    return next(caughtError);
  }
});
