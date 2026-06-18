/**
 * @file routes/admin.ts
 * @description Admin portal API — all routes require auth + admin role.
 *
 * Mounted at /api/v1/admin in routes/index.ts.
 *
 * Route groups:
 *  GET  /dashboard
 *  GET/PATCH  /users, /users/:id/role
 *  GET/PATCH  /vendors, /vendors/:id/{approve,reject,verify}
 *  GET/PATCH  /packages, /packages/:id/{approve,reject,feature,bestseller}
 *  GET/PATCH  /bookings, /bookings/:id/status
 *  GET/PATCH  /reviews, /reviews/:id/{publish,unpublish,verify}
 *  GET/POST/PATCH/DELETE  /categories, /categories/:id
 *  GET/POST/PATCH/DELETE  /locations, /locations/:id
 *  GET/PATCH  /payouts, /payouts/:id/status
 *  GET  /audit-logs
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { supabaseAdmin } from '../lib/supabase';
import { toRecord, readString, readNumber } from '../utils/dbHelpers';
import { strictLimiter, readLimiter } from '../middleware/rateLimiter';
import {
  getAdminDashboard,
  getAdminEarningsForMonth,
  listUsers,
  getUserById,
  updateUserRole,
  listVendors,
  getVendorById,
  approveVendor,
  rejectVendor,
  verifyVendor,
  listPackages,
  getPackageById,
  approvePackage,
  rejectPackage,
  featurePackage,
  setBestsellerPackage,
  listBookings,
  getBookingById,
  updateBookingStatus,
  listReviews,
  publishReview,
  unpublishReview,
  verifyReview,
  listAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getCompanyOwnerId,
} from '../services/adminService';
import { createNotification } from '../services/notificationService';
import { getAuditLogs, logAdminAction } from '../services/auditLogService';
import { getAdminAnalytics } from '../services/analyticsService';
import { listPayouts, updatePayoutStatus } from '../services/payoutService';
import { success, notFound, validationError, error as errorResponse } from '../utils/response';
import { AppError } from '../constants/errors';
import {
  AdminUuidParamSchema,
  AdminListUsersQuerySchema,
  AdminUpdateUserRoleSchema,
  AdminListVendorsQuerySchema,
  AdminApproveVendorSchema,
  AdminRejectVendorSchema,
  AdminListPackagesQuerySchema,
  AdminApprovePackageSchema,
  AdminRejectPackageSchema,
  AdminFeaturePackageSchema,
  AdminBestsellerPackageSchema,
  AdminListBookingsQuerySchema,
  AdminUpdateBookingStatusSchema,
  AdminListReviewsQuerySchema,
  AdminCreateCategorySchema,
  AdminUpdateCategorySchema,
  AdminListLocationsQuerySchema,
  AdminCreateLocationSchema,
  AdminUpdateLocationSchema,
  AdminListPayoutsQuerySchema,
  AdminUpdatePayoutStatusSchema,
  AdminListAuditLogsQuerySchema,
  AdminEarningsQuerySchema,
} from '../utils/adminValidation';

export const adminRouter = Router();

// All admin routes require auth + admin role
adminRouter.use(requireAuth, requireRole(['admin']));

// Apply a read limiter (120 req/min) to all GET requests in this router.
// Write operations use strictLimiter applied per-route.
adminRouter.use((req, res, next) => {
  if (req.method === 'GET') return readLimiter(req, res, next);
  return next();
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/dashboard
 * Returns platform-wide analytics metrics.
 */
adminRouter.get('/dashboard', async (req, res, next) => {
  try {
    const metrics = await getAdminDashboard();
    return success(res, metrics);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/admin/earnings?month=YYYY-MM
 * Returns total paid-payment revenue for a single calendar month, used by
 * the Revenue Overview month picker on the admin dashboard.
 */
adminRouter.get('/earnings', async (req, res, next) => {
  try {
    const parsed = AdminEarningsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return validationError(res, parsed.error.flatten().fieldErrors);
    }
    const earnings = await getAdminEarningsForMonth(parsed.data.month);
    return success(res, earnings);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/admin/analytics
 * Returns time-series data for revenue charts, user growth, and booking funnel.
 */
adminRouter.get('/analytics', async (_req, res, next) => {
  try {
    const analytics = await getAdminAnalytics();
    return success(res, analytics);
  } catch (err) {
    return next(err);
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/users
 * Paginated list of all users. Supports search and role filter.
 */
adminRouter.get('/users', async (req, res, next) => {
  try {
    const parsed = AdminListUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listUsers({
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
      role: parsed.data.role,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/admin/users/:id
 * Returns a single user with email and booking count.
 */
adminRouter.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = AdminUuidParamSchema.parse(req.params);
    const user = await getUserById(id);
    return success(res, user);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'User');
    return next(err);
  }
});

/**
 * DELETE /api/v1/admin/users/:id
 * Permanently deletes a user account (admin cannot delete themselves).
 */
adminRouter.delete('/users/:id', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);

    if (id === adminUser.id) {
      return errorResponse(res, 'You cannot delete your own account', 403);
    }

    // Reuse the shared deleteAccount service which cascades bookings + auth
    const { deleteAccount } = await import('../services/userService');
    await deleteAccount(id);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'delete_user',
      entityType: 'user',
      entityId: id,
      metadata: {},
    });

    return success(res, { deleted: true });
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'User');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/users/:id/role
 * Updates a user's role. Admin cannot downgrade their own account.
 */
adminRouter.patch('/users/:id/role', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminUpdateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    if (id === adminUser.id) {
      return errorResponse(res, 'You cannot change your own role', 403);
    }

    const user = await updateUserRole(id, parsed.data.role);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'update_user_role',
      entityType: 'user',
      entityId: id,
      metadata: { new_role: parsed.data.role },
    });

    return success(res, user);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'User');
    if (err instanceof AppError && err.statusCode === 409) {
      return errorResponse(res, err.message, 409);
    }
    return next(err);
  }
});

// ── Vendors ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/vendors
 * Paginated vendor list with owner info. Supports search, status, is_verified filters.
 */
adminRouter.get('/vendors', async (req, res, next) => {
  try {
    const parsed = AdminListVendorsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listVendors({
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
      status: parsed.data.status,
      isVerified: parsed.data.is_verified,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/admin/vendors/:id
 */
adminRouter.get('/vendors/:id', async (req, res, next) => {
  try {
    const { id } = AdminUuidParamSchema.parse(req.params);
    const vendor = await getVendorById(id);
    return success(res, vendor);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Vendor');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/vendors/:id/approve
 */
adminRouter.patch('/vendors/:id/approve', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminApproveVendorSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const vendor = await approveVendor(id);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'approve_vendor',
      entityType: 'vendor',
      entityId: id,
      metadata: { note: parsed.data.note ?? null },
    });

    void createNotification(
      vendor.owner_id,
      'vendor_approved',
      'Vendor Account Approved 🎉',
      'Congratulations! Your vendor account has been approved. You can now list packages and start receiving bookings.',
      { vendor_id: id },
    );

    return success(res, vendor);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Vendor');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/vendors/:id/reject
 */
adminRouter.patch('/vendors/:id/reject', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminRejectVendorSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const vendor = await rejectVendor(id, parsed.data.reason);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'reject_vendor',
      entityType: 'vendor',
      entityId: id,
      metadata: { reason: parsed.data.reason },
    });

    void createNotification(
      vendor.owner_id,
      'vendor_rejected',
      'Vendor Application Update',
      `Your vendor application was not approved. Reason: ${parsed.data.reason}`,
      { vendor_id: id, reason: parsed.data.reason },
    );

    return success(res, vendor);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Vendor');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/vendors/:id/verify
 */
adminRouter.patch('/vendors/:id/verify', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const vendor = await verifyVendor(id);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'verify_vendor',
      entityType: 'vendor',
      entityId: id,
    });

    return success(res, vendor);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Vendor');
    return next(err);
  }
});

// ── Packages ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/packages
 * Paginated package list with company, location, category info.
 */
adminRouter.get('/packages', async (req, res, next) => {
  try {
    const parsed = AdminListPackagesQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listPackages({
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
      status: parsed.data.status,
      companyId: parsed.data.company_id,
      isFeatured: parsed.data.is_featured,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/admin/packages/:id
 */
adminRouter.get('/packages/:id', async (req, res, next) => {
  try {
    const { id } = AdminUuidParamSchema.parse(req.params);
    const pkg = await getPackageById(id);
    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/packages/:id/approve
 */
adminRouter.patch('/packages/:id/approve', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminApprovePackageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pkg = await approvePackage(id, adminUser.id, parsed.data.note);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'approve_package',
      entityType: 'package',
      entityId: id,
      metadata: { note: parsed.data.note ?? null },
    });

    void getCompanyOwnerId(pkg.company_id).then((ownerId) => {
      if (ownerId) {
        void createNotification(
          ownerId,
          'package_approved',
          'Package Approved 🎉',
          `Your package "${pkg.title}" has been approved and is now live for travelers to book.`,
          { package_id: id },
          id,
          'package',
        );
      }
    });

    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/packages/:id/reject
 */
adminRouter.patch('/packages/:id/reject', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminRejectPackageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pkg = await rejectPackage(id, adminUser.id, parsed.data.reason);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'reject_package',
      entityType: 'package',
      entityId: id,
      metadata: { reason: parsed.data.reason },
    });

    void getCompanyOwnerId(pkg.company_id).then((ownerId) => {
      if (ownerId) {
        void createNotification(
          ownerId,
          'package_rejected',
          'Package Needs Changes',
          `Your package "${pkg.title}" was not approved. Reason: ${parsed.data.reason}`,
          { package_id: id, reason: parsed.data.reason },
          id,
          'package',
        );
      }
    });

    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/packages/:id/feature
 */
adminRouter.patch('/packages/:id/feature', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminFeaturePackageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pkg = await featurePackage(id, parsed.data.is_featured, parsed.data.is_bestseller);

    void logAdminAction({
      adminId: adminUser.id,
      action: parsed.data.is_featured ? 'feature_package' : 'unfeature_package',
      entityType: 'package',
      entityId: id,
    });

    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/packages/:id/bestseller
 */
adminRouter.patch('/packages/:id/bestseller', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminBestsellerPackageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pkg = await setBestsellerPackage(id, parsed.data.is_bestseller);

    void logAdminAction({
      adminId: adminUser.id,
      action: parsed.data.is_bestseller ? 'set_bestseller' : 'unset_bestseller',
      entityType: 'package',
      entityId: id,
    });

    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    return next(err);
  }
});

/**
 * DELETE /api/v1/admin/packages/:id
 * Hard-deletes a draft or rejected package with no bookings.
 * Admin bypasses ownership checks entirely.
 */
adminRouter.delete('/packages/:id', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);

    const { data, error } = await supabaseAdmin
      .from('packages')
      .select('id, status, total_bookings')
      .eq('id', id)
      .maybeSingle();

    if (error !== null) return next(error);
    if (data === null) return notFound(res, 'Package');

    const row = toRecord(data);
    const status = readString(row, 'status');
    const totalBookings = readNumber(row, 'total_bookings');

    if (status === 'active' || status === 'pending') {
      return errorResponse(res, `Cannot delete a ${status} package. Only draft or rejected packages can be deleted.`, 409);
    }
    if (totalBookings > 0) {
      return errorResponse(res, 'This package has existing bookings and cannot be deleted.', 409);
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('packages')
      .delete()
      .eq('id', id);

    if (deleteErr !== null) return next(deleteErr);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'delete_package',
      entityType: 'package',
      entityId: id,
      metadata: {},
    });

    return success(res, { deleted: true });
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 409) {
      return errorResponse(res, err.message, 409);
    }
    return next(err);
  }
});

// ── Bookings ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/bookings
 */
adminRouter.get('/bookings', async (req, res, next) => {
  try {
    const parsed = AdminListBookingsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listBookings({
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
      status: parsed.data.status,
      paymentStatus: parsed.data.payment_status,
      companyId: parsed.data.company_id,
      fromDate: parsed.data.from_date,
      toDate: parsed.data.to_date,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/admin/bookings/:id
 */
adminRouter.get('/bookings/:id', async (req, res, next) => {
  try {
    const { id } = AdminUuidParamSchema.parse(req.params);
    const booking = await getBookingById(id);
    return success(res, booking);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Booking');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/bookings/:id/status
 */
adminRouter.patch('/bookings/:id/status', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminUpdateBookingStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const booking = await updateBookingStatus(id, parsed.data.status, adminUser.id, parsed.data.note);

    void logAdminAction({
      adminId: adminUser.id,
      action: `update_booking_status_${parsed.data.status}`,
      entityType: 'booking',
      entityId: id,
      metadata: { new_status: parsed.data.status, note: parsed.data.note ?? null },
    });

    return success(res, booking);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Booking');
    return next(err);
  }
});

// ── Reviews ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/reviews
 */
adminRouter.get('/reviews', async (req, res, next) => {
  try {
    const parsed = AdminListReviewsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listReviews({
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
      isPublished: parsed.data.is_published,
      isVerified: parsed.data.is_verified,
      packageId: parsed.data.package_id,
      minRating: parsed.data.min_rating,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/reviews/:id/publish
 */
adminRouter.patch('/reviews/:id/publish', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const review = await publishReview(id);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'publish_review',
      entityType: 'review',
      entityId: id,
    });

    return success(res, review);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Review');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/reviews/:id/unpublish
 */
adminRouter.patch('/reviews/:id/unpublish', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const review = await unpublishReview(id);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'unpublish_review',
      entityType: 'review',
      entityId: id,
    });

    return success(res, review);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Review');
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/reviews/:id/verify
 */
adminRouter.patch('/reviews/:id/verify', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const review = await verifyReview(id);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'verify_review',
      entityType: 'review',
      entityId: id,
    });

    return success(res, review);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Review');
    return next(err);
  }
});

// ── Categories ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/categories
 * Supports optional ?page and ?limit query params (default: page=1, limit=100, max limit=200).
 */
adminRouter.get('/categories', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query['limit']) || 100));
    const categories = await listAllCategories({ page, limit });
    return success(res, categories);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/v1/admin/categories
 */
adminRouter.post('/categories', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const parsed = AdminCreateCategorySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const category = await createCategory(parsed.data);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'create_category',
      entityType: 'category',
      entityId: category.id,
      metadata: { name: category.name },
    });

    return success(res, category, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 409) {
      return errorResponse(res, err.message, 409);
    }
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/categories/:id
 */
adminRouter.patch('/categories/:id', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminUpdateCategorySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const category = await updateCategory(id, parsed.data);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'update_category',
      entityType: 'category',
      entityId: id,
    });

    return success(res, category);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Category');
    return next(err);
  }
});

/**
 * DELETE /api/v1/admin/categories/:id
 */
adminRouter.delete('/categories/:id', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    await deleteCategory(id);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'delete_category',
      entityType: 'category',
      entityId: id,
    });

    return success(res, { deleted: true });
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Category');
    if (err instanceof AppError && err.statusCode === 409) {
      return errorResponse(res, err.message, 409);
    }
    return next(err);
  }
});

// ── Locations ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/locations
 */
adminRouter.get('/locations', async (req, res, next) => {
  try {
    const parsed = AdminListLocationsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listAllLocations({
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/v1/admin/locations
 */
adminRouter.post('/locations', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const parsed = AdminCreateLocationSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const location = await createLocation(parsed.data);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'create_location',
      entityType: 'location',
      entityId: location.id,
      metadata: { city: location.city, state: location.state },
    });

    return success(res, location, 201);
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/locations/:id
 */
adminRouter.patch('/locations/:id', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminUpdateLocationSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const location = await updateLocation(id, parsed.data);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'update_location',
      entityType: 'location',
      entityId: id,
    });

    return success(res, location);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Location');
    return next(err);
  }
});

/**
 * DELETE /api/v1/admin/locations/:id
 */
adminRouter.delete('/locations/:id', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    await deleteLocation(id);

    void logAdminAction({
      adminId: adminUser.id,
      action: 'delete_location',
      entityType: 'location',
      entityId: id,
    });

    return success(res, { deleted: true });
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Location');
    if (err instanceof AppError && err.statusCode === 409) {
      return errorResponse(res, err.message, 409);
    }
    return next(err);
  }
});

// ── Payouts ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/payouts
 */
adminRouter.get('/payouts', async (req, res, next) => {
  try {
    const parsed = AdminListPayoutsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listPayouts({
      page: parsed.data.page,
      limit: parsed.data.limit,
      status: parsed.data.status,
      companyId: parsed.data.company_id,
      fromDate: parsed.data.from_date,
      toDate: parsed.data.to_date,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/v1/admin/payouts/:id/status
 */
adminRouter.patch('/payouts/:id/status', strictLimiter, async (req, res, next) => {
  try {
    const adminUser = req.user;
    if (!adminUser) return errorResponse(res, 'Unauthorized', 401);

    const { id } = AdminUuidParamSchema.parse(req.params);
    const parsed = AdminUpdatePayoutStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const payout = await updatePayoutStatus(id, parsed.data.status, parsed.data.gateway_response);

    void logAdminAction({
      adminId: adminUser.id,
      action: `update_payout_status_${parsed.data.status}`,
      entityType: 'payout',
      entityId: id,
      metadata: { new_status: parsed.data.status },
    });

    return success(res, payout);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Payout');
    return next(err);
  }
});

// ── Audit logs ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/audit-logs
 * Read-only. Supports filtering by admin, entity, action, and date range.
 */
adminRouter.get('/audit-logs', async (req, res, next) => {
  try {
    const parsed = AdminListAuditLogsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await getAuditLogs({
      page: parsed.data.page,
      limit: parsed.data.limit,
      adminId: parsed.data.admin_id,
      entityType: parsed.data.entity_type,
      entityId: parsed.data.entity_id,
      action: parsed.data.action,
      fromDate: parsed.data.from_date,
      toDate: parsed.data.to_date,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});
