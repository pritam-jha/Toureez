/**
 * @file utils/adminValidation.ts
 * @description Zod validation schemas for all admin and vendor API payloads.
 *
 * Naming convention:
 *  - *Schema  — the Zod schema object
 *  - *Input   — the TypeScript type inferred from the schema (z.infer<typeof ...Schema>)
 */

import { z } from 'zod';

// ── Shared primitives ──────────────────────────────────────────────────────────

const trimmedString = (min: number, max: number) =>
  z.string().trim().min(min, `Must be at least ${min} characters`).max(max, `Must be at most ${max} characters`);

const optionalTrimmed = (min: number, max: number) =>
  trimmedString(min, max).optional();

const paginationSchema = z.object({
  page: z
    .preprocess((v) => (v === undefined || v === '' ? 1 : v), z.coerce.number().int().min(1))
    .default(1),
  limit: z
    .preprocess((v) => (v === undefined || v === '' ? 20 : v), z.coerce.number().int().min(1).max(100))
    .default(20),
});

export const AdminUuidParamSchema = z.object({
  id: z.string().uuid('Invalid resource ID'),
});

// ── Admin: User management ────────────────────────────────────────────────────

export const AdminListUsersQuerySchema = paginationSchema.extend({
  search: optionalTrimmed(1, 120),
  role: z.enum(['traveler', 'company_owner', 'admin']).optional(),
});

export const AdminUpdateUserRoleSchema = z
  .object({
    role: z.enum(['traveler', 'company_owner', 'admin']),
  })
  .strict();

export type AdminUpdateUserRoleInput = z.infer<typeof AdminUpdateUserRoleSchema>;

// ── Admin: Vendor management ──────────────────────────────────────────────────

export const AdminListVendorsQuerySchema = paginationSchema.extend({
  search: optionalTrimmed(1, 120),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  is_verified: z
    .preprocess((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    }, z.boolean())
    .optional(),
});

export const AdminApproveVendorSchema = z
  .object({
    note: optionalTrimmed(1, 500),
  })
  .strict();

export const AdminRejectVendorSchema = z
  .object({
    reason: trimmedString(5, 500),
  })
  .strict();

export type AdminRejectVendorInput = z.infer<typeof AdminRejectVendorSchema>;

// ── Admin: Package moderation ─────────────────────────────────────────────────

export const AdminListPackagesQuerySchema = paginationSchema.extend({
  search: optionalTrimmed(1, 120),
  status: z.enum(['draft', 'pending', 'active', 'rejected']).optional(),
  company_id: z.string().uuid().optional(),
  is_featured: z
    .preprocess((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    }, z.boolean())
    .optional(),
});

export const AdminApprovePackageSchema = z
  .object({
    note: optionalTrimmed(1, 500),
  })
  .strict();

export const AdminRejectPackageSchema = z
  .object({
    reason: trimmedString(5, 500),
  })
  .strict();

export const AdminFeaturePackageSchema = z
  .object({
    is_featured: z.boolean(),
    is_bestseller: z.boolean().optional(),
  })
  .strict();

/** Dedicated schema for the /bestseller endpoint — only accepts is_bestseller. */
export const AdminBestsellerPackageSchema = z
  .object({
    is_bestseller: z.boolean(),
  })
  .strict();

export type AdminRejectPackageInput = z.infer<typeof AdminRejectPackageSchema>;
export type AdminFeaturePackageInput = z.infer<typeof AdminFeaturePackageSchema>;
export type AdminBestsellerPackageInput = z.infer<typeof AdminBestsellerPackageSchema>;

// ── Admin: Booking management ─────────────────────────────────────────────────

export const AdminListBookingsQuerySchema = paginationSchema.extend({
  search: optionalTrimmed(1, 120),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  payment_status: z.enum(['pending', 'paid', 'refunded', 'failed']).optional(),
  company_id: z.string().uuid().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
});

export const AdminUpdateBookingStatusSchema = z
  .object({
    status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
    note: optionalTrimmed(1, 500),
  })
  .strict();

export type AdminUpdateBookingStatusInput = z.infer<typeof AdminUpdateBookingStatusSchema>;

// ── Admin: Review moderation ──────────────────────────────────────────────────

export const AdminListReviewsQuerySchema = paginationSchema.extend({
  search: optionalTrimmed(1, 120),
  is_published: z
    .preprocess((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    }, z.boolean())
    .optional(),
  is_verified: z
    .preprocess((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    }, z.boolean())
    .optional(),
  package_id: z.string().uuid().optional(),
  min_rating: z
    .preprocess((v) => (v === undefined || v === '' ? undefined : v), z.coerce.number().min(1).max(5))
    .optional(),
});

// ── Admin: Category CRUD ──────────────────────────────────────────────────────

export const AdminCreateCategorySchema = z
  .object({
    name: trimmedString(1, 80),
    label: trimmedString(1, 120),
    icon: trimmedString(1, 50),
    description: optionalTrimmed(1, 500),
    is_active: z.boolean().default(true),
    display_order: z.number().int().min(0).default(0),
  })
  .strict();

export const AdminUpdateCategorySchema = z
  .object({
    name: optionalTrimmed(1, 80),
    label: optionalTrimmed(1, 120),
    icon: optionalTrimmed(1, 50),
    description: optionalTrimmed(1, 500),
    is_active: z.boolean().optional(),
    display_order: z.number().int().min(0).optional(),
  })
  .strict();

export type AdminCreateCategoryInput = z.infer<typeof AdminCreateCategorySchema>;
export type AdminUpdateCategoryInput = z.infer<typeof AdminUpdateCategorySchema>;

// ── Admin: Location CRUD ──────────────────────────────────────────────────────

export const AdminCreateLocationSchema = z
  .object({
    city: trimmedString(1, 120),
    state: trimmedString(1, 120),
    region: trimmedString(1, 120),
    country: z.string().trim().min(1).max(120).default('India'),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    is_popular: z.boolean().default(false),
    is_active: z.boolean().default(true),
  })
  .strict();

export const AdminUpdateLocationSchema = z
  .object({
    city: optionalTrimmed(1, 120),
    state: optionalTrimmed(1, 120),
    region: optionalTrimmed(1, 120),
    country: optionalTrimmed(1, 120),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    is_popular: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

export type AdminCreateLocationInput = z.infer<typeof AdminCreateLocationSchema>;
export type AdminUpdateLocationInput = z.infer<typeof AdminUpdateLocationSchema>;

// ── Admin: Location list query ────────────────────────────────────────────────

export const AdminListLocationsQuerySchema = paginationSchema.extend({
  search: optionalTrimmed(1, 120),
});

export type AdminListLocationsQueryInput = z.infer<typeof AdminListLocationsQuerySchema>;

// ── Admin: Payout management ──────────────────────────────────────────────────

export const AdminListPayoutsQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'processing', 'paid', 'failed']).optional(),
  company_id: z.string().uuid().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const AdminUpdatePayoutStatusSchema = z
  .object({
    status: z.enum(['pending', 'processing', 'paid', 'failed']),
    note: optionalTrimmed(1, 500),
    gateway_response: z.record(z.unknown()).optional(),
  })
  .strict();

export type AdminUpdatePayoutStatusInput = z.infer<typeof AdminUpdatePayoutStatusSchema>;

// ── Admin: Audit logs query ───────────────────────────────────────────────────

export const AdminListAuditLogsQuerySchema = paginationSchema.extend({
  admin_id: z.string().uuid().optional(),
  entity_type: optionalTrimmed(1, 100),
  entity_id: z.string().uuid().optional(),
  action: optionalTrimmed(1, 200),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ── Admin: Earnings query ─────────────────────────────────────────────────────

/**
 * Validates the query for GET /api/v1/admin/earnings.
 * `month` must be in YYYY-MM format (e.g. "2026-06").
 */
export const AdminEarningsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be in YYYY-MM format'),
});
