import { Router } from 'express';
import { computeBadges } from '../services/badgeService';
import {
  attachBadgesToPackages,
  getFeaturedPackages,
  getPackageById,
  getPackagesForCompare,
  getSimilarPackages,
  searchPackages,
} from '../services/packageService';
import {
  deletePackageImage,
  getPackageImages,
  savePackageImage,
  setPackageCoverImage,
} from '../services/packageImageService';
import { requireAuth } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
import { success } from '../utils/response';
import {
  CompareIdsSchema,
  ImageParamsSchema,
  PackageImageSaveSchema,
  SearchFiltersSchema,
  UuidParamSchema,
} from '../utils/validation';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
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

/**
 * GET /api/v1/packages/:id/similar
 * Returns up to 6 active packages in the same category/location.
 * Public — no auth required.
 */
packagesRouter.get('/:id/similar', async (req, res, next) => {
  try {
    const { id } = UuidParamSchema.parse(req.params);
    const similar = await getSimilarPackages(id);
    return success(res, similar);
  } catch (caughtError) {
    return next(caughtError);
  }
});

// ── Vendor image management (authenticated, owner only) ───────────────────────

packagesRouter.get('/:id/images', requireAuth, async (req, res, next) => {
  try {
    if (req.user === undefined) throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    const { id } = UuidParamSchema.parse(req.params);
    const images = await getPackageImages(id, req.user.id);
    return success(res, images);
  } catch (caughtError) {
    return next(caughtError);
  }
});

packagesRouter.post('/:id/images', requireAuth, strictLimiter, async (req, res, next) => {
  try {
    if (req.user === undefined) throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    const { id } = UuidParamSchema.parse(req.params);
    const input = PackageImageSaveSchema.parse(req.body);
    const image = await savePackageImage(id, req.user.id, input);
    return success(res, image, 201);
  } catch (caughtError) {
    return next(caughtError);
  }
});

packagesRouter.patch('/:id/images/:imageId/cover', requireAuth, async (req, res, next) => {
  try {
    if (req.user === undefined) throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    const { id, imageId } = ImageParamsSchema.parse(req.params);
    await setPackageCoverImage(id, imageId, req.user.id);
    return success(res, null);
  } catch (caughtError) {
    return next(caughtError);
  }
});

packagesRouter.delete('/:id/images/:imageId', requireAuth, async (req, res, next) => {
  try {
    if (req.user === undefined) throw new AppError(ERROR_MESSAGES.AUTH_REQUIRED, 401);
    const { id, imageId } = ImageParamsSchema.parse(req.params);
    await deletePackageImage(id, imageId, req.user.id);
    return success(res, null);
  } catch (caughtError) {
    return next(caughtError);
  }
});
