/**
 * @file services/vendorPackageService.ts
 * @description Package CRUD operations scoped to the authenticated vendor.
 *
 * Covers:
 *  - Listing vendor's own packages with filters/pagination
 *  - Fetching package detail (with pricing, itinerary, images)
 *  - Creating a draft package
 *  - Updating package core fields
 *  - Submitting a package for admin review (draft → pending)
 *  - Upserting pricing tiers (full replacement)
 *  - Upserting itinerary days (full replacement)
 *  - Saving package images (Cloudinary URL already uploaded by client)
 *  - Deleting a package image
 *  - Setting a package image as cover
 *
 * All operations enforce ownership by resolving the vendor's company_id
 * and verifying that every package being mutated belongs to that company.
 * Status-based soft-delete is preferred over hard delete when bookings exist.
 */

import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabaseAdmin } from '../lib/supabase';
import type { PaginatedResponse } from '../types';
import type {
  CreatePackageInput,
  UpdatePackageInput,
  UpsertPricingInput,
  UpsertItineraryInput,
  VendorPackageImageSaveInput,
  VendorListPackagesQuery,
} from '../utils/vendorValidation';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VendorPackageListItem {
  id: string;
  company_id: string;
  location_id: string | null;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  duration_days: number;
  duration_nights: number;
  min_group_size: number;
  max_group_size: number;
  status: 'draft' | 'pending' | 'active' | 'rejected';
  is_featured: boolean;
  is_bestseller: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  location: { city: string; state: string } | null;
  category: { name: string; label: string; icon: string } | null;
  lowest_price: number | null;
}

export interface VendorPackageDetail extends VendorPackageListItem {
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  amenities: string[];
  pricing: VendorPricingTier[];
  itinerary: VendorItineraryDay[];
  images: VendorPackageImage[];
  rejection_reason: string | null;
}

export interface VendorPricingTier {
  id: string;
  package_id: string;
  label: string;
  min_people: number;
  max_people: number;
  base_price: number;
  discounted_price: number | null;
  currency: string;
  season: 'all' | 'peak' | 'off-peak';
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export interface VendorItineraryDay {
  id: string;
  package_id: string;
  day_number: number;
  title: string;
  description: string | null;
  meals: string[];
  accommodation: string | null;
  activities: string[];
  transport: string | null;
}

export interface VendorPackageImage {
  id: string;
  package_id: string;
  url: string;
  public_id: string;
  alt_text: string | null;
  is_cover: boolean;
  display_order: number;
}

// ── Safe accessor helpers ─────────────────────────────────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const toRecord = (v: unknown): Record<string, unknown> =>
  isRecord(v) ? v : Array.isArray(v) && isRecord(v[0]) ? (v[0] as Record<string, unknown>) : {};

const readString = (r: Record<string, unknown>, k: string, fb = ''): string =>
  typeof r[k] === 'string' ? (r[k] as string) : fb;

const readNullableString = (r: Record<string, unknown>, k: string): string | null =>
  typeof r[k] === 'string' ? (r[k] as string) : null;

const readNumber = (r: Record<string, unknown>, k: string, fb = 0): number => {
  const v = r[k];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const p = Number.parseFloat(v);
    return Number.isFinite(p) ? p : fb;
  }
  return fb;
};

const readBoolean = (r: Record<string, unknown>, k: string, fb = false): boolean =>
  typeof r[k] === 'boolean' ? (r[k] as boolean) : fb;

const readStringArray = (r: Record<string, unknown>, k: string): string[] =>
  Array.isArray(r[k]) ? (r[k] as string[]).filter((x) => typeof x === 'string') : [];

const throwDb = (op: string, err: unknown): never => {
  console.error(`[vendorPackageService.${op}]`, err);
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

// ── Ownership guard ───────────────────────────────────────────────────────────

/**
 * Resolves the company ID for the given owner and returns it.
 * Throws 404 if no company exists for this owner.
 */
async function resolveCompanyId(ownerId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error !== null) throwDb('resolveCompanyId', error);
  if (data === null) {
    throw new AppError('Company profile not found. Please complete onboarding first.', 404);
  }
  return (data as { id: string }).id;
}

/**
 * Verifies that the given package belongs to the vendor's company.
 * Throws 403 if ownership check fails, 404 if package does not exist.
 */
async function assertPackageOwnership(packageId: string, companyId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('packages')
    .select('id, company_id')
    .eq('id', packageId)
    .maybeSingle();

  if (error !== null) throwDb('assertPackageOwnership', error);
  if (data === null) throw new AppError('Package not found', 404);

  const row = toRecord(data);
  if (readString(row, 'company_id') !== companyId) {
    throw new AppError('You do not have permission to modify this package', 403);
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapListItem = (row: Record<string, unknown>): VendorPackageListItem => {
  const locRaw = toRecord(row['location']);
  const catRaw = toRecord(row['category']);
  const pricingRaw = Array.isArray(row['pricing']) ? (row['pricing'] as unknown[]) : [];

  // Derive cover_image from the package_images array (is_cover flag).
  // PostgREST does not support inline filtered embedded resource aliases in SELECT,
  // so we fetch all images with url+is_cover and find the cover here.
  const imagesRaw = Array.isArray(row['package_images']) ? (row['package_images'] as unknown[]) : [];
  const coverImg = imagesRaw.find((img) => readBoolean(toRecord(img), 'is_cover'));
  const coverImage = coverImg != null ? readNullableString(toRecord(coverImg), 'url') : null;

  const lowestPrice =
    pricingRaw.length > 0
      ? pricingRaw.reduce((min: number | null, p) => {
          const pRow = toRecord(p);
          if (!readBoolean(pRow, 'is_active', true)) return min;
          const price = readNumber(pRow, 'base_price');
          return min === null || price < min ? price : min;
        }, null)
      : null;

  return {
    id: readString(row, 'id'),
    company_id: readString(row, 'company_id'),
    location_id: readNullableString(row, 'location_id'),
    category_id: readNullableString(row, 'category_id'),
    title: readString(row, 'title'),
    slug: readString(row, 'slug'),
    description: readNullableString(row, 'description'),
    duration_days: readNumber(row, 'duration_days'),
    duration_nights: readNumber(row, 'duration_nights'),
    min_group_size: readNumber(row, 'min_group_size', 1),
    max_group_size: readNumber(row, 'max_group_size', 20),
    status: readString(row, 'status', 'draft') as VendorPackageListItem['status'],
    is_featured: readBoolean(row, 'is_featured'),
    is_bestseller: readBoolean(row, 'is_bestseller'),
    avg_rating: readNumber(row, 'avg_rating'),
    review_count: readNumber(row, 'review_count'),
    total_bookings: readNumber(row, 'total_bookings'),
    cover_image: coverImage,
    created_at: readString(row, 'created_at'),
    updated_at: readString(row, 'updated_at'),
    location:
      Object.keys(locRaw).length > 0
        ? { city: readString(locRaw, 'city'), state: readString(locRaw, 'state') }
        : null,
    category:
      Object.keys(catRaw).length > 0
        ? {
            name: readString(catRaw, 'name'),
            label: readString(catRaw, 'label'),
            icon: readString(catRaw, 'icon'),
          }
        : null,
    lowest_price: lowestPrice,
  };
};

const mapPricingTier = (row: Record<string, unknown>): VendorPricingTier => ({
  id: readString(row, 'id'),
  package_id: readString(row, 'package_id'),
  label: readString(row, 'label'),
  min_people: readNumber(row, 'min_people', 1),
  max_people: readNumber(row, 'max_people', 20),
  base_price: readNumber(row, 'base_price'),
  discounted_price: typeof row['discounted_price'] === 'number' ? row['discounted_price'] : null,
  currency: readString(row, 'currency', 'INR'),
  season: readString(row, 'season', 'all') as VendorPricingTier['season'],
  valid_from: readNullableString(row, 'valid_from'),
  valid_until: readNullableString(row, 'valid_until'),
  is_active: readBoolean(row, 'is_active', true),
});

const mapItineraryDay = (row: Record<string, unknown>): VendorItineraryDay => ({
  id: readString(row, 'id'),
  package_id: readString(row, 'package_id'),
  day_number: readNumber(row, 'day_number'),
  title: readString(row, 'title'),
  description: readNullableString(row, 'description'),
  meals: readStringArray(row, 'meals'),
  accommodation: readNullableString(row, 'accommodation'),
  activities: readStringArray(row, 'activities'),
  transport: readNullableString(row, 'transport'),
});

const mapImage = (row: Record<string, unknown>): VendorPackageImage => ({
  id: readString(row, 'id'),
  package_id: readString(row, 'package_id'),
  url: readString(row, 'url'),
  public_id: readString(row, 'public_id'),
  alt_text: readNullableString(row, 'alt_text'),
  is_cover: readBoolean(row, 'is_cover'),
  display_order: readNumber(row, 'display_order'),
});

// ── Package list ──────────────────────────────────────────────────────────────

/**
 * Lists packages belonging to the vendor's company.
 * Supports status filter, full-text search, and pagination.
 */
export async function listVendorPackages(
  ownerId: string,
  query: VendorListPackagesQuery,
): Promise<PaginatedResponse<VendorPackageListItem>> {
  const companyId = await resolveCompanyId(ownerId);
  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;

  let dbQuery = supabaseAdmin
    .from('packages')
    .select(
      `id, company_id, location_id, category_id, title, slug, description,
       duration_days, duration_nights, min_group_size, max_group_size,
       status, is_featured, is_bestseller, avg_rating, review_count,
       total_bookings, created_at, updated_at,
       package_images(url, is_cover),
       location:locations(city, state),
       category:categories(name, label, icon),
       pricing:package_pricing(base_price, is_active)`,
      { count: 'exact' },
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (query.status !== undefined) {
    dbQuery = dbQuery.eq('status', query.status);
  }

  if (query.search !== undefined) {
    dbQuery = dbQuery.ilike('title', `%${query.search}%`);
  }

  const { data, error, count } = await dbQuery;
  if (error !== null) throwDb('listVendorPackages', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;

  return {
    items: rows.map((r) => mapListItem(toRecord(r))),
    total,
    page: query.page,
    limit: query.limit,
    has_more: from + rows.length < total,
  };
}

// ── Package detail ────────────────────────────────────────────────────────────

/**
 * Fetches full package detail for editing.
 * Includes pricing tiers, itinerary days, and gallery images.
 */
export async function getVendorPackage(ownerId: string, packageId: string): Promise<VendorPackageDetail> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  const [pkgResult, pricingResult, itineraryResult, imagesResult] = await Promise.all([
    supabaseAdmin
      .from('packages')
      .select('*, location:locations(city, state), category:categories(name, label, icon)')
      .eq('id', packageId)
      .single(),
    supabaseAdmin
      .from('package_pricing')
      .select('*')
      .eq('package_id', packageId)
      .order('min_people', { ascending: true }),
    supabaseAdmin
      .from('itineraries')
      .select('*')
      .eq('package_id', packageId)
      .order('day_number', { ascending: true }),
    supabaseAdmin
      .from('package_images')
      .select('*')
      .eq('package_id', packageId)
      .order('display_order', { ascending: true }),
  ]);

  if (pkgResult.error !== null) throwDb('getVendorPackage.pkg', pkgResult.error);
  if (pkgResult.data === null) throw new AppError('Package not found', 404);

  const row = toRecord(pkgResult.data);
  const locRaw = toRecord(row['location']);
  const catRaw = toRecord(row['category']);

  const pricingRows = (pricingResult.data as unknown[] | null) ?? [];
  const itineraryRows = (itineraryResult.data as unknown[] | null) ?? [];
  const imageRows = (imagesResult.data as unknown[] | null) ?? [];

  const coverImageRow = imageRows.find((r) => readBoolean(toRecord(r), 'is_cover'));
  const coverImage = coverImageRow ? readNullableString(toRecord(coverImageRow), 'url') : null;

  return {
    ...mapListItem({ ...row, cover_image: coverImage }),
    highlights: readStringArray(row, 'highlights'),
    inclusions: readStringArray(row, 'inclusions'),
    exclusions: readStringArray(row, 'exclusions'),
    amenities: readStringArray(row, 'amenities'),
    location:
      Object.keys(locRaw).length > 0
        ? { city: readString(locRaw, 'city'), state: readString(locRaw, 'state') }
        : null,
    category:
      Object.keys(catRaw).length > 0
        ? {
            name: readString(catRaw, 'name'),
            label: readString(catRaw, 'label'),
            icon: readString(catRaw, 'icon'),
          }
        : null,
    pricing: pricingRows.map((r) => mapPricingTier(toRecord(r))),
    itinerary: itineraryRows.map((r) => mapItineraryDay(toRecord(r))),
    images: imageRows.map((r) => mapImage(toRecord(r))),
    rejection_reason: readNullableString(row, 'rejection_reason'),
  };
}

// ── Create package ────────────────────────────────────────────────────────────

/**
 * Creates a new draft package for the vendor.
 */
export async function createVendorPackage(
  ownerId: string,
  input: CreatePackageInput,
): Promise<VendorPackageDetail> {
  const companyId = await resolveCompanyId(ownerId);

  const slug = `${input.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)}-${Date.now().toString(36)}`;

  const payload: Record<string, unknown> = {
    company_id: companyId,
    title: input.title,
    slug,
    status: 'draft',
    description: input.description ?? null,
    location_id: input.location_id,
    category_id: input.category_id,
    highlights: input.highlights ?? [],
    duration_days: input.duration_days ?? 1,
    duration_nights: input.duration_nights ?? 0,
    min_group_size: input.min_group_size ?? 1,
    max_group_size: input.max_group_size ?? 20,
    inclusions: input.inclusions ?? [],
    exclusions: input.exclusions ?? [],
    amenities: input.amenities ?? [],
    is_featured: false,
    is_bestseller: false,
    avg_rating: 0,
    review_count: 0,
    total_bookings: 0,
  };

  const { data, error } = await supabaseAdmin
    .from('packages')
    .insert(payload)
    .select('*')
    .single();

  if (error !== null) throwDb('createVendorPackage', error);
  if (data === null) throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);

  return getVendorPackage(ownerId, (data as { id: string }).id);
}

// ── Update package ────────────────────────────────────────────────────────────

/**
 * Partially updates a vendor's package.
 * Only provided fields are applied. Active packages revert to draft on changes.
 */
export async function updateVendorPackage(
  ownerId: string,
  packageId: string,
  input: UpdatePackageInput,
): Promise<VendorPackageDetail> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates['title'] = input.title;
  if (input.description !== undefined) updates['description'] = input.description;
  if (input.location_id !== undefined) updates['location_id'] = input.location_id;
  if (input.category_id !== undefined) updates['category_id'] = input.category_id;
  if (input.highlights !== undefined) updates['highlights'] = input.highlights;
  if (input.duration_days !== undefined) updates['duration_days'] = input.duration_days;
  if (input.duration_nights !== undefined) updates['duration_nights'] = input.duration_nights;
  if (input.min_group_size !== undefined) updates['min_group_size'] = input.min_group_size;
  if (input.max_group_size !== undefined) updates['max_group_size'] = input.max_group_size;
  if (input.inclusions !== undefined) updates['inclusions'] = input.inclusions;
  if (input.exclusions !== undefined) updates['exclusions'] = input.exclusions;
  if (input.amenities !== undefined) updates['amenities'] = input.amenities;

  if (Object.keys(updates).length === 0) {
    return getVendorPackage(ownerId, packageId);
  }

  updates['updated_at'] = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from('packages')
    .update(updates)
    .eq('id', packageId);

  if (error !== null) throwDb('updateVendorPackage', error);
  return getVendorPackage(ownerId, packageId);
}

// ── Submit for review ─────────────────────────────────────────────────────────

/** Fields required before a package can be submitted for admin review. */
const REQUIRED_FOR_SUBMIT = [
  'location_id',
  'category_id',
  'description',
  'duration_days',
] as const;

/**
 * Transitions a package from draft to pending (submitted for admin review).
 * Validates that all required fields are populated before transitioning.
 */
export async function submitVendorPackage(
  ownerId: string,
  packageId: string,
): Promise<VendorPackageDetail> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  // ── KYC gate: company must be approved before packages can go live ──────────
  const { data: companyRow, error: companyErr } = await supabaseAdmin
    .from('companies')
    .select('status, is_verified')
    .eq('id', companyId)
    .maybeSingle();

  if (companyErr !== null) throwDb('submitVendorPackage.companyCheck', companyErr);

  const companyStatus = readString(toRecord(companyRow), 'status', 'pending');
  if (companyStatus !== 'approved') {
    throw new AppError(
      'Your company profile must be approved by the NEXTTRP team before you can submit packages for review. ' +
      'Please complete your company KYC and wait for admin approval.',
      403,
    );
  }

  // Fetch current state to validate completeness
  const { data: raw, error: fetchErr } = await supabaseAdmin
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .single();

  if (fetchErr !== null) throwDb('submitVendorPackage.fetch', fetchErr);
  if (raw === null) throw new AppError('Package not found', 404);

  const row = toRecord(raw);
  const currentStatus = readString(row, 'status');

  if (currentStatus === 'active') {
    throw new AppError('Active packages cannot be re-submitted. Update the package to move it back to draft first.', 409);
  }

  if (currentStatus === 'pending') {
    throw new AppError('This package is already under review.', 409);
  }

  // Validate required fields
  const missing: string[] = [];
  for (const field of REQUIRED_FOR_SUBMIT) {
    const val = row[field];
    if (val === null || val === undefined || val === '') missing.push(field);
  }

  // Check that at least one pricing tier exists
  const { count: pricingCount } = await supabaseAdmin
    .from('package_pricing')
    .select('id', { count: 'exact', head: true })
    .eq('package_id', packageId)
    .eq('is_active', true);

  if ((pricingCount ?? 0) === 0) {
    missing.push('pricing (at least one active tier required)');
  }

  if (missing.length > 0) {
    throw new AppError(
      `Package cannot be submitted. Complete the following fields first: ${missing.join(', ')}.`,
      422,
    );
  }

  // Record status history
  await supabaseAdmin.from('package_status_history').insert({
    package_id: packageId,
    from_status: currentStatus,
    to_status: 'pending',
    changed_by: ownerId,
    note: 'Vendor submitted for admin review',
  });

  const { error: updateErr } = await supabaseAdmin
    .from('packages')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', packageId);

  if (updateErr !== null) throwDb('submitVendorPackage.update', updateErr);
  return getVendorPackage(ownerId, packageId);
}

// ── Pricing ───────────────────────────────────────────────────────────────────

/**
 * Replaces all pricing tiers for a package.
 * Existing tiers not present in the new payload are deleted.
 * Existing tiers with matching IDs are updated; new tiers are inserted.
 */
export async function upsertPackagePricing(
  ownerId: string,
  packageId: string,
  input: UpsertPricingInput,
): Promise<VendorPricingTier[]> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  const incomingIds = input.tiers.filter((t) => t.id !== undefined).map((t) => t.id as string);

  // Delete tiers that are no longer in the payload
  if (incomingIds.length > 0) {
    await supabaseAdmin
      .from('package_pricing')
      .delete()
      .eq('package_id', packageId)
      .not('id', 'in', `(${incomingIds.map((id) => `'${id}'`).join(',')})`);
  } else {
    // No existing IDs provided — delete all and re-insert
    await supabaseAdmin.from('package_pricing').delete().eq('package_id', packageId);
  }

  const tiersToInsert = input.tiers.filter((t) => t.id === undefined);
  const tiersToUpdate = input.tiers.filter((t) => t.id !== undefined);

  const insertPayloads = tiersToInsert.map((t) => ({
    package_id: packageId,
    label: t.label,
    min_people: t.min_people,
    max_people: t.max_people,
    base_price: t.base_price,
    discounted_price: t.discounted_price ?? null,
    currency: t.currency ?? 'INR',
    season: t.season ?? 'all',
    valid_from: t.valid_from ?? null,
    valid_until: t.valid_until ?? null,
    is_active: t.is_active ?? true,
  }));

  if (insertPayloads.length > 0) {
    const { error: insertErr } = await supabaseAdmin.from('package_pricing').insert(insertPayloads);
    if (insertErr !== null) throwDb('upsertPackagePricing.insert', insertErr);
  }

  for (const t of tiersToUpdate) {
    const { error: updateErr } = await supabaseAdmin
      .from('package_pricing')
      .update({
        label: t.label,
        min_people: t.min_people,
        max_people: t.max_people,
        base_price: t.base_price,
        discounted_price: t.discounted_price ?? null,
        currency: t.currency ?? 'INR',
        season: t.season ?? 'all',
        valid_from: t.valid_from ?? null,
        valid_until: t.valid_until ?? null,
        is_active: t.is_active ?? true,
      })
      .eq('id', t.id as string)
      .eq('package_id', packageId);

    if (updateErr !== null) throwDb('upsertPackagePricing.update', updateErr);
  }

  const { data, error } = await supabaseAdmin
    .from('package_pricing')
    .select('*')
    .eq('package_id', packageId)
    .order('min_people', { ascending: true });

  if (error !== null) throwDb('upsertPackagePricing.fetch', error);
  return ((data as unknown[] | null) ?? []).map((r) => mapPricingTier(toRecord(r)));
}

// ── Itinerary ─────────────────────────────────────────────────────────────────

/**
 * Replaces all itinerary days for a package (full replacement).
 */
export async function upsertPackageItinerary(
  ownerId: string,
  packageId: string,
  input: UpsertItineraryInput,
): Promise<VendorItineraryDay[]> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  // Delete all existing days and re-insert
  await supabaseAdmin.from('itineraries').delete().eq('package_id', packageId);

  const insertPayloads = input.days.map((d) => ({
    package_id: packageId,
    day_number: d.day_number,
    title: d.title,
    description: d.description ?? null,
    meals: d.meals ?? [],
    accommodation: d.accommodation ?? null,
    activities: d.activities ?? [],
    transport: d.transport ?? null,
  }));

  const { data, error } = await supabaseAdmin
    .from('itineraries')
    .insert(insertPayloads)
    .select('*');

  if (error !== null) throwDb('upsertPackageItinerary', error);
  const rows = (data as unknown[] | null) ?? [];
  return rows
    .map((r) => mapItineraryDay(toRecord(r)))
    .sort((a, b) => a.day_number - b.day_number);
}

// ── Images ────────────────────────────────────────────────────────────────────

/**
 * Saves a package image record after the file has been uploaded to Cloudinary.
 * Automatically assigns display_order as last in the gallery.
 */
export async function savePackageImage(
  ownerId: string,
  packageId: string,
  input: VendorPackageImageSaveInput,
): Promise<VendorPackageImage> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  // Determine current max display_order
  const { data: existing } = await supabaseAdmin
    .from('package_images')
    .select('display_order')
    .eq('package_id', packageId)
    .order('display_order', { ascending: false })
    .limit(1);

  const maxOrder =
    existing && Array.isArray(existing) && existing.length > 0
      ? readNumber(toRecord(existing[0]), 'display_order')
      : -1;

  // If this is the first image or marked as cover, set is_cover = true and unset all others
  const isFirstImage = maxOrder === -1;

  if (input.is_cover || isFirstImage) {
    await supabaseAdmin
      .from('package_images')
      .update({ is_cover: false })
      .eq('package_id', packageId);
  }

  const { data, error } = await supabaseAdmin
    .from('package_images')
    .insert({
      package_id: packageId,
      url: input.url,
      public_id: input.public_id,
      alt_text: input.alt_text ?? null,
      is_cover: input.is_cover || isFirstImage,
      display_order: maxOrder + 1,
      uploaded_by: ownerId,
    })
    .select('*')
    .single();

  if (error !== null) throwDb('savePackageImage', error);
  if (data === null) throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
  return mapImage(toRecord(data));
}

/**
 * Deletes a package image. Prefers soft-delete semantics where bookings exist.
 * If the deleted image was the cover, promotes the next image to cover.
 */
export async function deletePackageImage(
  ownerId: string,
  packageId: string,
  imageId: string,
): Promise<void> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  // Fetch the image to check cover status
  const { data: imgData, error: fetchErr } = await supabaseAdmin
    .from('package_images')
    .select('is_cover, display_order')
    .eq('id', imageId)
    .eq('package_id', packageId)
    .maybeSingle();

  if (fetchErr !== null) throwDb('deletePackageImage.fetch', fetchErr);
  if (imgData === null) throw new AppError('Image not found', 404);

  const imgRow = toRecord(imgData);
  const wasCover = readBoolean(imgRow, 'is_cover');

  const { error: deleteErr } = await supabaseAdmin
    .from('package_images')
    .delete()
    .eq('id', imageId)
    .eq('package_id', packageId);

  if (deleteErr !== null) throwDb('deletePackageImage.delete', deleteErr);

  // Promote the next image to cover if the deleted one was the cover
  if (wasCover) {
    const { data: nextImg } = await supabaseAdmin
      .from('package_images')
      .select('id')
      .eq('package_id', packageId)
      .order('display_order', { ascending: true })
      .limit(1);

    if (nextImg && Array.isArray(nextImg) && nextImg.length > 0) {
      const nextId = readString(toRecord(nextImg[0]), 'id');
      await supabaseAdmin
        .from('package_images')
        .update({ is_cover: true })
        .eq('id', nextId);
    }
  }
}

/**
 * Sets a specific image as the package cover.
 * Unsets is_cover on all other images for this package.
 */
export async function setPackageCoverImage(
  ownerId: string,
  packageId: string,
  imageId: string,
): Promise<VendorPackageImage> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  // Unset all covers first
  await supabaseAdmin
    .from('package_images')
    .update({ is_cover: false })
    .eq('package_id', packageId);

  // Set the new cover
  const { data, error } = await supabaseAdmin
    .from('package_images')
    .update({ is_cover: true })
    .eq('id', imageId)
    .eq('package_id', packageId)
    .select('*')
    .single();

  if (error !== null) throwDb('setPackageCoverImage', error);
  if (data === null) throw new AppError('Image not found', 404);
  return mapImage(toRecord(data));
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export interface VendorBookingListItem {
  id: string;
  booking_reference: string;
  travel_date: string;
  num_travelers: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  package: { id: string; title: string; cover_image: string | null };
  user: { id: string; full_name: string | null; phone: string | null; email: string };
}

export interface VendorBookingDetail extends VendorBookingListItem {
  pricing_id: string;
  traveler_details: unknown[];
  payment: {
    amount_paid: number;
    payment_method: string | null;
    paid_at: string | null;
    payment_type: string;
  } | null;
}

/**
 * Maps a booking row to VendorBookingListItem.
 * userRaw must be passed separately because bookings.user_id references
 * auth.users (not public.users), so the embed cannot be done in a single
 * PostgREST query — user data is fetched in a subsequent batch query.
 */
const mapBookingListItem = (
  row: Record<string, unknown>,
  userRaw: Record<string, unknown> = {},
): VendorBookingListItem => {
  const pkgRaw = toRecord(row['packages']);
  // Derive cover_image from the nested package_images array.
  const pkgImages = Array.isArray(pkgRaw['package_images']) ? (pkgRaw['package_images'] as unknown[]) : [];
  const pkgCoverImg = pkgImages.find((img) => readBoolean(toRecord(img), 'is_cover'));
  const pkgCoverUrl = pkgCoverImg != null ? readNullableString(toRecord(pkgCoverImg), 'url') : null;
  return {
    id: readString(row, 'id'),
    booking_reference: readString(row, 'booking_reference'),
    travel_date: readString(row, 'travel_date'),
    num_travelers: readNumber(row, 'num_travelers'),
    total_amount: readNumber(row, 'total_amount'),
    advance_amount: readNumber(row, 'advance_amount'),
    balance_amount: readNumber(row, 'balance_amount'),
    status: readString(row, 'status', 'pending') as VendorBookingListItem['status'],
    payment_status: readString(row, 'payment_status', 'pending') as VendorBookingListItem['payment_status'],
    special_requests: readNullableString(row, 'special_requests'),
    created_at: readString(row, 'created_at'),
    updated_at: readString(row, 'updated_at'),
    package: {
      id: readString(pkgRaw, 'id'),
      title: readString(pkgRaw, 'title'),
      cover_image: pkgCoverUrl,
    },
    user: {
      id: readString(userRaw, 'id', readString(row, 'user_id')),
      full_name: readNullableString(userRaw, 'full_name'),
      phone: readNullableString(userRaw, 'phone'),
      email: readString(userRaw, 'email', ''),
    },
  };
};

/**
 * Lists bookings for the vendor's company with filters and pagination.
 */
export async function listVendorBookings(
  ownerId: string,
  params: {
    page: number;
    limit: number;
    status?: string;
    paymentStatus?: string;
    packageId?: string;
    fromDate?: string;
    toDate?: string;
  },
): Promise<PaginatedResponse<VendorBookingListItem>> {
  const companyId = await resolveCompanyId(ownerId);
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  // bookings.user_id → auth.users — cannot embed public.users in one query.
  // Fetch user profiles in a separate batch query after getting bookings.
  let query = supabaseAdmin
    .from('bookings')
    .select(
      `id, booking_reference, travel_date, num_travelers, total_amount,
       advance_amount, balance_amount, status, payment_status, special_requests,
       created_at, updated_at, user_id,
       packages!bookings_package_id_fkey(id, title, package_images(url, is_cover))`,
      { count: 'exact' },
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq('status', params.status);
  if (params.paymentStatus) query = query.eq('payment_status', params.paymentStatus);
  if (params.packageId) query = query.eq('package_id', params.packageId);
  if (params.fromDate) query = query.gte('travel_date', params.fromDate);
  if (params.toDate) query = query.lte('travel_date', params.toDate);

  const { data, error, count } = await query;
  if (error !== null) throwDb('listVendorBookings', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;

  // Batch-fetch user profiles from public.users
  const userIds = [...new Set(rows.map((r) => readString(toRecord(r), 'user_id')).filter(Boolean))];
  const userMap = new Map<string, Record<string, unknown>>();
  if (userIds.length > 0) {
    const { data: userRows } = await supabaseAdmin
      .from('users')
      .select('id, full_name, phone')
      .in('id', userIds);
    (userRows ?? []).forEach((u) => {
      const rec = toRecord(u);
      userMap.set(readString(rec, 'id'), rec);
    });
  }

  return {
    items: rows.map((r) => {
      const row = toRecord(r);
      const userId = readString(row, 'user_id');
      return mapBookingListItem(row, userMap.get(userId) ?? {});
    }),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

/**
 * Fetches a single booking detail with traveler info and payment details.
 */
export async function getVendorBooking(
  ownerId: string,
  bookingId: string,
): Promise<VendorBookingDetail> {
  const companyId = await resolveCompanyId(ownerId);

  // Fetch booking row — no user embed (user_id → auth.users, not public.users)
  // Payment columns: actual schema uses 'amount' not 'amount_paid', 'created_at' not 'paid_at'
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      `*, user_id, packages!bookings_package_id_fkey(id, title),
       payments(amount, payment_method, created_at)`,
    )
    .eq('id', bookingId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error !== null) throwDb('getVendorBooking', error);
  if (data === null) throw new AppError('Booking not found', 404);

  const row = toRecord(data);

  // Fetch user profile from public.users
  const userId = readString(row, 'user_id');
  let userRaw: Record<string, unknown> = {};
  if (userId) {
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id, full_name, phone')
      .eq('id', userId)
      .maybeSingle();
    if (userRow !== null) userRaw = toRecord(userRow);
  }

  const base = mapBookingListItem(row, userRaw);

  // payments is returned as an array (one-to-many); take first record
  const paymentsRaw = Array.isArray(row['payments']) ? row['payments'] : [];
  const paymentRaw = paymentsRaw.length > 0 ? toRecord(paymentsRaw[0]) : {};

  return {
    ...base,
    pricing_id: readString(row, 'pricing_id'),
    traveler_details: Array.isArray(row['traveler_details']) ? row['traveler_details'] : [],
    payment:
      Object.keys(paymentRaw).length > 0
        ? {
            amount_paid: readNumber(paymentRaw, 'amount'),      // schema col: amount
            payment_method: readNullableString(paymentRaw, 'payment_method'),
            paid_at: readNullableString(paymentRaw, 'created_at'), // schema col: created_at
            payment_type: 'full',                                 // not in schema, default
          }
        : null,
  };
}

/**
 * Deletes a draft or rejected package.
 * Refuses deletion if the package is active/pending or has any bookings.
 */
export async function deleteVendorPackage(ownerId: string, packageId: string): Promise<void> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  const { data, error } = await supabaseAdmin
    .from('packages')
    .select('id, status, total_bookings')
    .eq('id', packageId)
    .maybeSingle();

  if (error !== null) throwDb('deleteVendorPackage.fetch', error);
  if (data === null) throw new AppError('Package not found', 404);

  const row = toRecord(data);
  const status = readString(row, 'status');
  const totalBookings = readNumber(row, 'total_bookings');

  if (status === 'active' || status === 'pending') {
    throw new AppError(
      `Cannot delete a ${status} package. Only draft or rejected packages can be deleted.`,
      409,
    );
  }

  if (totalBookings > 0) {
    throw new AppError(
      'This package has existing bookings and cannot be deleted.',
      409,
    );
  }

  const { error: deleteErr } = await supabaseAdmin
    .from('packages')
    .delete()
    .eq('id', packageId);

  if (deleteErr !== null) throwDb('deleteVendorPackage.delete', deleteErr);
}

/**
 * Updates a booking's status.
 * Vendor-allowed transitions:
 *   pending    → confirmed | cancelled
 *   confirmed  → completed | cancelled
 */
export async function updateVendorBookingStatus(
  ownerId: string,
  bookingId: string,
  status: 'confirmed' | 'cancelled' | 'completed',
  _note?: string,
): Promise<VendorBookingDetail> {
  const companyId = await resolveCompanyId(ownerId);

  // Verify booking belongs to this company
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('bookings')
    .select('id, status, company_id')
    .eq('id', bookingId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (fetchErr !== null) throwDb('updateVendorBookingStatus.fetch', fetchErr);
  if (existing === null) throw new AppError('Booking not found', 404);

  const existingRow = toRecord(existing);
  const currentStatus = readString(existingRow, 'status');

  // Guard invalid transitions
  if (currentStatus === 'cancelled') {
    throw new AppError('Cancelled bookings cannot be updated.', 409);
  }
  if (currentStatus === 'completed') {
    throw new AppError('Completed bookings cannot be updated.', 409);
  }

  // booking_status_events table not yet in schema — skip event recording for now.

  const { error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (updateErr !== null) throwDb('updateVendorBookingStatus.update', updateErr);
  return getVendorBooking(ownerId, bookingId);
}

/**
 * Duplicates an existing package as a new draft, copying all core fields,
 * pricing tiers, and itinerary (but NOT images — those belong to the original).
 *
 * Returns the newly created draft package.
 */
export async function duplicateVendorPackage(
  ownerId: string,
  packageId: string,
): Promise<VendorPackageDetail> {
  const companyId = await resolveCompanyId(ownerId);
  await assertPackageOwnership(packageId, companyId);

  // Fetch full detail to copy
  const source = await getVendorPackage(ownerId, packageId);

  // Insert new package row as draft
  const { data: newPkg, error: insertErr } = await supabaseAdmin
    .from('packages')
    .insert({
      company_id: companyId,
      location_id: source.location_id,
      category_id: source.category_id,
      title: `${source.title} (Copy)`,
      description: source.description,
      highlights: source.highlights,
      inclusions: source.inclusions,
      exclusions: source.exclusions,
      amenities: source.amenities,
      duration_days: source.duration_days,
      duration_nights: source.duration_nights,
      min_group_size: source.min_group_size,
      max_group_size: source.max_group_size,
      status: 'draft',
    })
    .select('id')
    .single();

  if (insertErr !== null) throwDb('duplicateVendorPackage.insert', insertErr);

  const newId = (newPkg as { id: string }).id;

  // Copy pricing tiers
  if (source.pricing.length > 0) {
    const pricingRows = source.pricing.map((t) => ({
      package_id: newId,
      label: t.label,
      min_people: t.min_people,
      max_people: t.max_people,
      base_price: t.base_price,
      discounted_price: t.discounted_price,
      currency: t.currency,
      season: t.season,
      valid_from: t.valid_from,
      valid_until: t.valid_until,
      is_active: t.is_active,
    }));

    const { error: pricingErr } = await supabaseAdmin.from('package_pricing').insert(pricingRows);
    if (pricingErr !== null) throwDb('duplicateVendorPackage.pricing', pricingErr);
  }

  // Copy itinerary days
  if (source.itinerary.length > 0) {
    const itineraryRows = source.itinerary.map((d) => ({
      package_id: newId,
      day_number: d.day_number,
      title: d.title,
      description: d.description,
      meals: d.meals,
      accommodation: d.accommodation,
      activities: d.activities,
      transport: d.transport,
    }));

    const { error: itinErr } = await supabaseAdmin.from('package_itinerary').insert(itineraryRows);
    if (itinErr !== null) throwDb('duplicateVendorPackage.itinerary', itinErr);
  }

  return getVendorPackage(ownerId, newId);
}
