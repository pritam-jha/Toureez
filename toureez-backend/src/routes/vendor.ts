/**
 * @file routes/vendor.ts
 * @description Vendor portal API — all routes require auth + company_owner role.
 *
 * Mounted at /api/v1/vendor in routes/index.ts.
 *
 * Route groups:
 *  GET  /me
 *  GET  /dashboard
 *  GET  /earnings
 *
 *  POST               /locations
 *
 *  GET/POST/PATCH     /company
 *  POST               /company/documents
 *
 *  GET/POST           /packages
 *  GET/PATCH          /packages/:id
 *  PATCH              /packages/:id/submit
 *  PATCH              /packages/:id/pricing
 *  PATCH              /packages/:id/itinerary
 *  POST               /packages/:id/images
 *  DELETE             /packages/:id/images/:imageId
 *  PATCH              /packages/:id/images/:imageId/cover
 *
 *  GET                /bookings
 *  GET                /bookings/:id
 *  PATCH              /bookings/:id/status
 *
 *  GET                /reviews
 *  GET                /enquiries
 *  GET                /enquiries/:id
 *  POST               /enquiries/:id/messages
 *  PATCH              /enquiries/:id/status
 *  GET                /payouts
 *  GET/POST           /payout-accounts
 *  GET                /notifications
 *  PATCH              /notifications/:id/read
 *  PATCH              /notifications/read-all
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { strictLimiter, defaultLimiter } from '../middleware/rateLimiter';
import { VENDOR_ROLE } from '../types';
import {
  getVendorProfile,
  getVendorDashboard,
  getVendorEarningsForMonth,
  getVendorCompany,
  createVendorCompany,
  updateVendorCompany,
  saveCompanyDocument,
  getVendorReviews,
  getVendorPayouts,
  createPayoutAccount,
  getPayoutAccounts,
  getVendorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  requireCompanyId,
} from '../services/vendorService';
import {
  listVendorPackages,
  getVendorPackage,
  createVendorPackage,
  updateVendorPackage,
  submitVendorPackage,
  deleteVendorPackage,
  duplicateVendorPackage,
  upsertPackagePricing,
  upsertPackageItinerary,
  savePackageImage,
  deletePackageImage,
  setPackageCoverImage,
  listVendorBookings,
  getVendorBooking,
  updateVendorBookingStatus,
} from '../services/vendorPackageService';
import { getVendorAnalytics } from '../services/analyticsService';
import { createLocation } from '../services/locationService';
import {
  getVendorEnquiries,
  getVendorEnquiryDetail,
  addVendorMessage,
  setVendorEnquiryStatus,
} from '../services/enquiryService';
import { success, notFound, validationError } from '../utils/response';
import { AppError } from '../constants/errors';
import {
  VendorUuidParamSchema,
  VendorImageParamsSchema,
  CreateCompanySchema,
  UpdateCompanySchema,
  UploadCompanyDocumentSchema,
  VendorListPackagesQuerySchema,
  CreatePackageSchema,
  UpdatePackageSchema,
  UpsertPricingSchema,
  UpsertItinerarySchema,
  VendorPackageImageSaveSchema,
  VendorListBookingsQuerySchema,
  VendorUpdateBookingStatusSchema,
  CreatePayoutAccountSchema,
  VendorListNotificationsQuerySchema,
  CreateLocationSchema,
  VendorEarningsQuerySchema,
  narrowPaginationSchema,
} from '../utils/vendorValidation';
import { EnquiryMessageSchema } from '../utils/validation';
import { z } from 'zod';

export const vendorRouter = Router();

// All vendor routes require auth + company_owner role
vendorRouter.use(requireAuth, requireRole([VENDOR_ROLE]));
vendorRouter.use(defaultLimiter);

// ── Vendor profile ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/vendor/me
 * Returns the authenticated vendor's user profile and company summary.
 */
vendorRouter.get('/me', async (req, res, next) => {
  try {
    const profile = await getVendorProfile(req.user!.id);
    return success(res, profile);
  } catch (err) {
    return next(err);
  }
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/vendor/dashboard
 * Returns aggregated metrics: packages, bookings, revenue, reviews, payouts.
 */
vendorRouter.get('/dashboard', async (req, res, next) => {
  try {
    const metrics = await getVendorDashboard(req.user!.id);
    return success(res, metrics);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) {
      return notFound(res, 'Company');
    }
    return next(err);
  }
});

/**
 * GET /api/v1/vendor/earnings?month=YYYY-MM
 * Returns confirmed/completed booking revenue for a single calendar month,
 * used by the Earnings Overview month picker on the vendor dashboard.
 */
vendorRouter.get('/earnings', async (req, res, next) => {
  try {
    const parsed = VendorEarningsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return validationError(res, parsed.error.issues.map((i) => i.message).join(', '));
    }
    const earnings = await getVendorEarningsForMonth(req.user!.id, parsed.data.month);
    return success(res, earnings);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) {
      return notFound(res, 'Company');
    }
    return next(err);
  }
});

// ── Locations ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/vendor/locations
 * Lets a vendor add a destination that isn't yet in the saved locations list.
 * Returns the existing location if the same city/state already exists.
 */
vendorRouter.post('/locations', async (req, res, next) => {
  try {
    const parsed = CreateLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      return validationError(res, parsed.error.issues.map((i) => i.message).join(', '));
    }
    const location = await createLocation(parsed.data);
    return success(res, location, 201);
  } catch (err) {
    return next(err);
  }
});

// ── Company ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/vendor/company
 * Returns the vendor's company profile, or null if not yet created.
 */
vendorRouter.get('/company', async (req, res, next) => {
  try {
    const company = await getVendorCompany(req.user!.id);
    return success(res, company);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/v1/vendor/company
 * Creates the vendor's company profile (first-time onboarding).
 * Responds 409 if a company already exists.
 */
vendorRouter.post('/company', strictLimiter, async (req, res, next) => {
  try {
    const parsed = CreateCompanySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const company = await createVendorCompany(req.user!.id, parsed.data);
    return success(res, company, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 409) {
      return res.status(409).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/company
 * Updates the vendor's existing company profile. Partial update supported.
 */
vendorRouter.patch('/company', strictLimiter, async (req, res, next) => {
  try {
    const parsed = UpdateCompanySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const company = await updateVendorCompany(req.user!.id, parsed.data);
    return success(res, company);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

/**
 * POST /api/v1/vendor/company/documents
 * Saves a company document (Cloudinary URL) after client-side upload.
 */
vendorRouter.post('/company/documents', strictLimiter, async (req, res, next) => {
  try {
    const parsed = UploadCompanyDocumentSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const document = await saveCompanyDocument(req.user!.id, parsed.data);
    return success(res, document, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

// ── Packages ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/vendor/packages
 * Paginated list of the vendor's packages. Supports status filter and search.
 */
vendorRouter.get('/packages', async (req, res, next) => {
  try {
    const parsed = VendorListPackagesQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listVendorPackages(req.user!.id, parsed.data);
    return success(res, result);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

/**
 * POST /api/v1/vendor/packages
 * Creates a new draft package for the vendor.
 */
vendorRouter.post('/packages', strictLimiter, async (req, res, next) => {
  try {
    const parsed = CreatePackageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pkg = await createVendorPackage(req.user!.id, parsed.data);
    return success(res, pkg, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

/**
 * GET /api/v1/vendor/packages/:id
 * Returns full package detail including pricing, itinerary, and images.
 */
vendorRouter.get('/packages/:id', async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const pkg = await getVendorPackage(req.user!.id, id);
    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/packages/:id
 * Updates core package fields (title, description, duration, etc.).
 */
vendorRouter.patch('/packages/:id', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = UpdatePackageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pkg = await updateVendorPackage(req.user!.id, id, parsed.data);
    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

/**
 * DELETE /api/v1/vendor/packages/:id
 * Permanently deletes a draft or rejected package that has no bookings.
 */
vendorRouter.delete('/packages/:id', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    await deleteVendorPackage(req.user!.id, id);
    return success(res, { deleted: true });
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    if (err instanceof AppError && err.statusCode === 409) {
      return res.status(409).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

/**
 * POST /api/v1/vendor/packages/:id/duplicate
 * Creates a draft copy of the package with "(Copy)" suffix.
 */
vendorRouter.post('/packages/:id/duplicate', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const pkg = await duplicateVendorPackage(req.user!.id, id);
    return success(res, pkg, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    return next(err);
  }
});

/**
 * GET /api/v1/vendor/analytics
 * Returns revenue charts and performance metrics for the authenticated vendor.
 */
vendorRouter.get('/analytics', async (req, res, next) => {
  try {
    const companyId = await requireCompanyId(req.user!.id);
    const analytics = await getVendorAnalytics(companyId);
    return success(res, analytics);
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/packages/:id/submit
 * Transitions the package from draft to pending (submitted for admin review).
 */
vendorRouter.patch('/packages/:id/submit', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const pkg = await submitVendorPackage(req.user!.id, id);
    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 409) {
      return res.status(409).json({ success: false, data: null, error: err.message });
    }
    if (err instanceof AppError && err.statusCode === 422) {
      return res.status(422).json({ success: false, data: null, error: err.message });
    }
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/packages/:id/pricing
 * Replaces all pricing tiers for a package. Full replacement strategy.
 */
vendorRouter.patch('/packages/:id/pricing', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = UpsertPricingSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pricing = await upsertPackagePricing(req.user!.id, id, parsed.data);
    return success(res, pricing);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/packages/:id/itinerary
 * Replaces all itinerary days for a package. Full replacement strategy.
 */
vendorRouter.patch('/packages/:id/itinerary', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = UpsertItinerarySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const itinerary = await upsertPackageItinerary(req.user!.id, id, parsed.data);
    return success(res, itinerary);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

/**
 * POST /api/v1/vendor/packages/:id/images
 * Saves a Cloudinary-uploaded image for the package gallery.
 */
vendorRouter.post('/packages/:id/images', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = VendorPackageImageSaveSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const image = await savePackageImage(req.user!.id, id, parsed.data);
    return success(res, image, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

/**
 * DELETE /api/v1/vendor/packages/:id/images/:imageId
 * Deletes a package image. Promotes next image to cover if deleted was cover.
 */
vendorRouter.delete('/packages/:id/images/:imageId', strictLimiter, async (req, res, next) => {
  try {
    const { id, imageId } = VendorImageParamsSchema.parse(req.params);
    await deletePackageImage(req.user!.id, id, imageId);
    return success(res, { deleted: true });
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Image');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/packages/:id/images/:imageId/cover
 * Sets the specified image as the package cover image.
 */
vendorRouter.patch('/packages/:id/images/:imageId/cover', strictLimiter, async (req, res, next) => {
  try {
    const { id, imageId } = VendorImageParamsSchema.parse(req.params);
    const image = await setPackageCoverImage(req.user!.id, id, imageId);
    return success(res, image);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Image');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

// ── Bookings ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/vendor/bookings
 * Paginated list of bookings for the vendor's company.
 */
vendorRouter.get('/bookings', async (req, res, next) => {
  try {
    const parsed = VendorListBookingsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listVendorBookings(req.user!.id, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      status: parsed.data.status,
      paymentStatus: parsed.data.payment_status,
      packageId: parsed.data.package_id,
      fromDate: parsed.data.from_date,
      toDate: parsed.data.to_date,
    });
    return success(res, result);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

/**
 * GET /api/v1/vendor/bookings/:id
 * Returns full booking detail with traveler info and payment summary.
 */
vendorRouter.get('/bookings/:id', async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const booking = await getVendorBooking(req.user!.id, id);
    return success(res, booking);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Booking');
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/bookings/:id/status
 * Updates booking status. Vendors may confirm or cancel pending bookings.
 */
vendorRouter.patch('/bookings/:id/status', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = VendorUpdateBookingStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const booking = await updateVendorBookingStatus(
      req.user!.id,
      id,
      parsed.data.status,
      parsed.data.note,
    );
    return success(res, booking);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Booking');
    if (err instanceof AppError && err.statusCode === 409) {
      return res.status(409).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

// ── Reviews ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/vendor/reviews
 * Returns published reviews for the vendor's packages.
 */
vendorRouter.get('/reviews', async (req, res, next) => {
  try {
    const parsed = narrowPaginationSchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await getVendorReviews(req.user!.id, parsed.data);
    return success(res, result);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

// ── Enquiries ─────────────────────────────────────────────────────────────────

const VendorEnquiryStatusSchema = z.object({ status: z.enum(['open', 'closed']) }).strict();

/**
 * GET /api/v1/vendor/enquiries
 * Returns enquiry threads addressed to the vendor's company.
 */
vendorRouter.get('/enquiries', async (req, res, next) => {
  try {
    const enquiries = await getVendorEnquiries(req.user!.id);
    return success(res, enquiries);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

/**
 * GET /api/v1/vendor/enquiries/:id
 * Returns a single enquiry thread with all messages.
 */
vendorRouter.get('/enquiries/:id', async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const enquiry = await getVendorEnquiryDetail(req.user!.id, id);
    return success(res, enquiry);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Enquiry');
    return next(err);
  }
});

/**
 * POST /api/v1/vendor/enquiries/:id/messages
 * Posts a reply to an enquiry thread.
 */
vendorRouter.post('/enquiries/:id/messages', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = EnquiryMessageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const enquiry = await addVendorMessage(req.user!.id, id, parsed.data.message);
    return success(res, enquiry);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Enquiry');
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/enquiries/:id/status
 * Marks an enquiry thread as open or closed.
 */
vendorRouter.patch('/enquiries/:id/status', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = VendorEnquiryStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const enquiry = await setVendorEnquiryStatus(req.user!.id, id, parsed.data.status);
    return success(res, enquiry);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Enquiry');
    return next(err);
  }
});

// ── Payouts ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/vendor/payouts
 * Returns payout disbursement history for the vendor's company.
 */
vendorRouter.get('/payouts', async (req, res, next) => {
  try {
    const parsed = narrowPaginationSchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await getVendorPayouts(req.user!.id, parsed.data);
    return success(res, result);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

/**
 * GET /api/v1/vendor/payout-accounts
 * Returns payout bank/UPI accounts for the vendor's company.
 */
vendorRouter.get('/payout-accounts', async (req, res, next) => {
  try {
    const accounts = await getPayoutAccounts(req.user!.id);
    return success(res, accounts);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

/**
 * POST /api/v1/vendor/payout-accounts
 * Adds a new payout bank/UPI account for the vendor's company.
 */
vendorRouter.post('/payout-accounts', strictLimiter, async (req, res, next) => {
  try {
    const parsed = CreatePayoutAccountSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const account = await createPayoutAccount(req.user!.id, parsed.data);
    return success(res, account, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

// ── Notifications ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/vendor/notifications
 * Returns paginated notifications for the authenticated vendor user.
 */
vendorRouter.get('/notifications', async (req, res, next) => {
  try {
    const parsed = VendorListNotificationsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await getVendorNotifications(req.user!.id, parsed.data);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/notifications/:id/read
 * Marks a specific notification as read.
 */
vendorRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    await markNotificationRead(req.user!.id, id);
    return success(res, { marked_read: true });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/v1/vendor/notifications/read-all
 * Marks all notifications for the vendor user as read.
 */
vendorRouter.patch('/notifications/read-all', async (req, res, next) => {
  try {
    await markAllNotificationsRead(req.user!.id);
    return success(res, { marked_read: true });
  } catch (err) {
    return next(err);
  }
});
