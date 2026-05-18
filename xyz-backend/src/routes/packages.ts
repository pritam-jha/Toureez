import { Router } from 'express';
import { computeBadges } from '../services/badgeService';
import {
  attachBadgesToPackages,
  getFeaturedPackages,
  getPackageById,
  getPackagesForCompare,
  searchPackages,
} from '../services/packageService';
import { defaultLimiter } from '../middleware/rateLimiter';
import { success } from '../utils/response';
import { CompareIdsSchema, SearchFiltersSchema, UuidParamSchema } from '../utils/validation';
import type { SearchFilters } from '../types';

/**
 * Public package discovery and detail routes.
 */
export const packagesRouter = Router();

packagesRouter.use(defaultLimiter);

packagesRouter.get('/', async (req, res, next) => {
  try {
    const filters: SearchFilters = SearchFiltersSchema.parse(req.query);
    const packages = await searchPackages(filters);
    return success(res, packages);
  } catch (caughtError) {
    return next(caughtError);
  }
});

packagesRouter.get('/compare', async (req, res, next) => {
  try {
    const { ids } = CompareIdsSchema.parse(req.query);
    const packages = await getPackagesForCompare(ids);
    const badges = computeBadges(packages);
    return success(res, attachBadgesToPackages(packages, badges));
  } catch (caughtError) {
    return next(caughtError);
  }
});

packagesRouter.get('/featured', async (_req, res, next) => {
  try {
    const packages = await getFeaturedPackages();
    return success(res, packages);
  } catch (caughtError) {
    return next(caughtError);
  }
});

packagesRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = UuidParamSchema.parse(req.params);
    const packageDetail = await getPackageById(id);
    return success(res, packageDetail);
  } catch (caughtError) {
    return next(caughtError);
  }
});
