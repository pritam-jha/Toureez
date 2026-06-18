import { AppError, ERROR_MESSAGES } from '../constants/errors';
// FIXED: 4 - Public package discovery uses the clearly named anon client.
import { supabasePublic } from '../lib/supabase';
import { logger } from '../utils/logger';
import type {
  Badge,
  Itinerary,
  Package,
  PackageDetail,
  PackageImage,
  PackageListItem,
  PackagePricing,
  PackageStatus,
  PaginatedResponse,
  SearchFilters,
} from '../types';

const PACKAGE_LIST_SELECT = `
  *,
  company:companies(id, name, logo_url, is_verified),
  location:locations(id, city, state),
  category:categories(id, name, label, icon)
`;

const PACKAGE_DETAIL_SELECT = `
  *,
  company:companies(id, name, slug, logo_url, is_verified, avg_rating, total_reviews, owner_id),
  location:locations(id, city, state, region),
  category:categories(id, name, label, icon)
`;

type PricingMode = 'min' | 'all';

type ListPricing = Pick<PackagePricing, 'base_price' | 'discounted_price' | 'currency'>;

interface ListAssets {
  coverImages: Map<string, string | null>;
  pricing: Map<string, ListPricing[]>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) ? first : {};
  }

  return isRecord(value) ? value : {};
};

const readString = (record: Record<string, unknown>, key: string, fallback = ''): string => {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
};

const readNullableString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' ? value : null;
};

const readNumber = (record: Record<string, unknown>, key: string, fallback = 0): number => {
  const value = record[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const readBoolean = (record: Record<string, unknown>, key: string, fallback = false): boolean => {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
};

const readStringArray = (record: Record<string, unknown>, key: string): string[] => {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
};

const readPackageStatus = (record: Record<string, unknown>): PackageStatus => {
  const status = readString(record, 'status');
  return status === 'draft' || status === 'pending' || status === 'active' || status === 'rejected'
    ? status
    : 'draft';
};

const readSeason = (record: Record<string, unknown>): PackagePricing['season'] => {
  const season = readString(record, 'season');
  return season === 'peak' || season === 'off-peak' ? season : 'all';
};

const getEffectivePrice = (pricing: ListPricing): number => {
  return pricing.discounted_price ?? pricing.base_price;
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  logger.error({ err: dbError, op: `packageService.${operation}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const emptyPaginatedResponse = <T>(page: number, limit: number): PaginatedResponse<T> => ({
  items: [],
  total: 0,
  page,
  limit,
  has_more: false,
});

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

const mapPackage = (record: Record<string, unknown>): Package => ({
  id: readString(record, 'id'),
  company_id: readString(record, 'company_id'),
  location_id: readString(record, 'location_id'),
  category_id: readString(record, 'category_id'),
  title: readString(record, 'title'),
  slug: readString(record, 'slug'),
  description: readNullableString(record, 'description'),
  highlights: readStringArray(record, 'highlights'),
  duration_days: readNumber(record, 'duration_days'),
  duration_nights: readNumber(record, 'duration_nights'),
  min_group_size: readNumber(record, 'min_group_size'),
  max_group_size: readNumber(record, 'max_group_size'),
  inclusions: readStringArray(record, 'inclusions'),
  exclusions: readStringArray(record, 'exclusions'),
  amenities: readStringArray(record, 'amenities'),
  status: readPackageStatus(record),
  is_featured: readBoolean(record, 'is_featured'),
  is_bestseller: readBoolean(record, 'is_bestseller'),
  avg_rating: readNumber(record, 'avg_rating'),
  review_count: readNumber(record, 'review_count'),
  total_bookings: readNumber(record, 'total_bookings'),
  created_at: readString(record, 'created_at'),
  updated_at: readString(record, 'updated_at'),
});

const mapListCompany = (value: unknown): PackageListItem['company'] => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    name: readString(record, 'name'),
    logo_url: readNullableString(record, 'logo_url'),
    is_verified: readBoolean(record, 'is_verified'),
  };
};

const mapListLocation = (value: unknown): PackageListItem['location'] => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    city: readString(record, 'city'),
    state: readString(record, 'state'),
  };
};

const mapListCategory = (value: unknown): PackageListItem['category'] => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    name: readString(record, 'name'),
    label: readString(record, 'label'),
    icon: readString(record, 'icon'),
  };
};

const mapDetailCompany = (value: unknown): PackageDetail['company'] => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    name: readString(record, 'name'),
    slug: readString(record, 'slug'),
    logo_url: readNullableString(record, 'logo_url'),
    is_verified: readBoolean(record, 'is_verified'),
    avg_rating: readNumber(record, 'avg_rating'),
    total_reviews: readNumber(record, 'total_reviews'),
    owner_id: readString(record, 'owner_id'),
  };
};

const mapDetailLocation = (value: unknown): PackageDetail['location'] => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    city: readString(record, 'city'),
    state: readString(record, 'state'),
    region: readString(record, 'region'),
  };
};

const mapDetailCategory = (value: unknown): PackageDetail['category'] => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    name: readString(record, 'name'),
    label: readString(record, 'label'),
    icon: readString(record, 'icon'),
  };
};

const mapPackageImage = (value: unknown): PackageImage => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    package_id: readString(record, 'package_id'),
    url: readString(record, 'url'),
    public_id: readString(record, 'public_id'),
    alt_text: readNullableString(record, 'alt_text'),
    is_cover: readBoolean(record, 'is_cover'),
    display_order: readNumber(record, 'display_order'),
  };
};

const mapItinerary = (value: unknown): Itinerary => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    package_id: readString(record, 'package_id'),
    day_number: readNumber(record, 'day_number'),
    title: readString(record, 'title'),
    description: readNullableString(record, 'description'),
    meals: readStringArray(record, 'meals'),
    accommodation: readNullableString(record, 'accommodation'),
    activities: readStringArray(record, 'activities'),
    transport: readNullableString(record, 'transport'),
  };
};

const mapPackagePricing = (value: unknown): PackagePricing => {
  const record = toRecord(value);

  return {
    id: readString(record, 'id'),
    package_id: readString(record, 'package_id'),
    label: readString(record, 'label'),
    min_people: readNumber(record, 'min_people'),
    max_people: readNumber(record, 'max_people'),
    base_price: readNumber(record, 'base_price'),
    discounted_price: record.discounted_price === null ? null : readNumber(record, 'discounted_price'),
    currency: readString(record, 'currency', 'INR'),
    season: readSeason(record),
    valid_from: readNullableString(record, 'valid_from'),
    valid_until: readNullableString(record, 'valid_until'),
    is_active: readBoolean(record, 'is_active'),
  };
};

const mapListPricing = (value: unknown): ListPricing => {
  const record = toRecord(value);

  return {
    base_price: readNumber(record, 'base_price'),
    discounted_price: record.discounted_price === null ? null : readNumber(record, 'discounted_price'),
    currency: readString(record, 'currency', 'INR'),
  };
};

const mapListItem = (record: Record<string, unknown>, assets: ListAssets): PackageListItem => {
  const packageEntity = mapPackage(record);

  return {
    ...packageEntity,
    cover_image: assets.coverImages.get(packageEntity.id) ?? null,
    company: mapListCompany(record.company),
    location: mapListLocation(record.location),
    category: mapListCategory(record.category),
    pricing: assets.pricing.get(packageEntity.id) ?? [],
    badges: [],
  };
};

const fetchCoverImages = async (packageIds: string[]): Promise<Map<string, string | null>> => {
  const coverImages = new Map<string, string | null>();

  packageIds.forEach((packageId) => coverImages.set(packageId, null));

  if (packageIds.length === 0) {
    return coverImages;
  }

  const { data, error } = await supabasePublic
    .from('package_images')
    .select('package_id, url, display_order')
    .in('package_id', packageIds)
    .eq('is_cover', true)
    .order('display_order', { ascending: true });

  if (error !== null) {
    throwDatabaseError('fetchCoverImages', error);
  }

  (data as unknown[] | null)?.forEach((row) => {
    const record = toRecord(row);
    const packageId = readString(record, 'package_id');
    const url = readString(record, 'url');

    if (packageId !== '' && url !== '' && coverImages.get(packageId) === null) {
      coverImages.set(packageId, url);
    }
  });

  return coverImages;
};

const fetchListPricing = async (packageIds: string[], mode: PricingMode): Promise<Map<string, ListPricing[]>> => {
  const pricingByPackage = new Map<string, ListPricing[]>();

  packageIds.forEach((packageId) => pricingByPackage.set(packageId, []));

  if (packageIds.length === 0) {
    return pricingByPackage;
  }

  const { data, error } = await supabasePublic
    .from('package_pricing')
    .select('package_id, base_price, discounted_price, currency')
    .in('package_id', packageIds)
    .eq('is_active', true)
    .order('base_price', { ascending: true });

  if (error !== null) {
    throwDatabaseError('fetchListPricing', error);
  }

  (data as unknown[] | null)?.forEach((row) => {
    const record = toRecord(row);
    const packageId = readString(record, 'package_id');

    if (packageId === '') {
      return;
    }

    const pricing = mapListPricing(record);
    const existing = pricingByPackage.get(packageId) ?? [];
    existing.push(pricing);
    pricingByPackage.set(packageId, existing);
  });

  pricingByPackage.forEach((rows, packageId) => {
    const sortedRows = rows.sort((left, right) => getEffectivePrice(left) - getEffectivePrice(right));
    pricingByPackage.set(packageId, mode === 'min' ? sortedRows.slice(0, 1) : sortedRows);
  });

  return pricingByPackage;
};

const fetchListAssets = async (packageIds: string[], pricingMode: PricingMode): Promise<ListAssets> => {
  const [coverImages, pricing] = await Promise.all([
    fetchCoverImages(packageIds),
    fetchListPricing(packageIds, pricingMode),
  ]);

  return { coverImages, pricing };
};

const buildListItems = async (records: unknown[], pricingMode: PricingMode): Promise<PackageListItem[]> => {
  const normalizedRecords = records.map(toRecord);
  const packageIds = normalizedRecords.map((record) => readString(record, 'id')).filter((id) => id !== '');
  const assets = await fetchListAssets(packageIds, pricingMode);

  return normalizedRecords.map((record) => mapListItem(record, assets));
};

const resolveCategoryIdsByName = async (categoryName: string | undefined): Promise<string[] | null> => {
  if (categoryName === undefined) {
    return null;
  }

  const { data, error } = await supabasePublic
    .from('categories')
    .select('id')
    .eq('is_active', true)
    .ilike('name', categoryName);

  if (error !== null) {
    throwDatabaseError('resolveCategoryIdsByName', error);
  }

  return uniqueStrings(
    ((data as unknown[] | null) ?? [])
      .map((row) => readString(toRecord(row), 'id'))
      .filter((id) => id !== ''),
  );
};

const resolveLocationIdsByState = async (state: string | undefined): Promise<string[] | null> => {
  if (state === undefined) {
    return null;
  }

  const { data, error } = await supabasePublic
    .from('locations')
    .select('id')
    .eq('is_active', true)
    .ilike('state', state);

  if (error !== null) {
    throwDatabaseError('resolveLocationIdsByState', error);
  }

  return uniqueStrings(
    ((data as unknown[] | null) ?? [])
      .map((row) => readString(toRecord(row), 'id'))
      .filter((id) => id !== ''),
  );
};

const resolvePackageIdsByPrice = async (
  minPrice: number | undefined,
  maxPrice: number | undefined,
): Promise<string[] | null> => {
  if (minPrice === undefined && maxPrice === undefined) {
    return null;
  }

  let query = supabasePublic.from('package_pricing').select('package_id').eq('is_active', true);

  if (minPrice !== undefined) {
    query = query.or(`discounted_price.gte.${minPrice},and(discounted_price.is.null,base_price.gte.${minPrice})`);
  }

  if (maxPrice !== undefined) {
    query = query.or(`discounted_price.lte.${maxPrice},and(discounted_price.is.null,base_price.lte.${maxPrice})`);
  }

  const { data, error } = await query;

  if (error !== null) {
    throwDatabaseError('resolvePackageIdsByPrice', error);
  }

  return uniqueStrings(
    ((data as unknown[] | null) ?? [])
      .map((row) => readString(toRecord(row), 'package_id'))
      .filter((id) => id !== ''),
  );
};

/**
 * Searches active packages using validated filters and returns a paginated list payload.
 */
export const searchPackages = async (filters: SearchFilters): Promise<PaginatedResponse<PackageListItem>> => {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 10, 50);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const [categoryIds, locationIds, pricePackageIds] = await Promise.all([
    resolveCategoryIdsByName(filters.category),
    resolveLocationIdsByState(filters.state),
    resolvePackageIdsByPrice(filters.min_price, filters.max_price),
  ]);

  if (
    (categoryIds !== null && categoryIds.length === 0) ||
    (locationIds !== null && locationIds.length === 0) ||
    (pricePackageIds !== null && pricePackageIds.length === 0)
  ) {
    return emptyPaginatedResponse<PackageListItem>(page, limit);
  }

  let query = supabasePublic
    .from('packages')
    .select(PACKAGE_LIST_SELECT, { count: 'exact' })
    .eq('status', 'active');

  if (filters.destination !== undefined) {
    query = query.textSearch('fts', filters.destination, {
      type: 'websearch',
    });
  }

  if (categoryIds !== null) {
    query = query.in('category_id', categoryIds);
  }

  if (locationIds !== null) {
    query = query.in('location_id', locationIds);
  }

  if (pricePackageIds !== null) {
    query = query.in('id', pricePackageIds);
  }

  if (filters.duration_days !== undefined) {
    query = query.eq('duration_days', filters.duration_days);
  }

  if (filters.min_rating !== undefined) {
    query = query.gte('avg_rating', filters.min_rating);
  }

  if (filters.amenities !== undefined && filters.amenities.length > 0) {
    query = query.contains('amenities', filters.amenities);
  }

  if (filters.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured);
  }

  const { data, error, count } = await query
    .order('is_featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error !== null) {
    throwDatabaseError('searchPackages', error);
  }

  const items = await buildListItems((data as unknown[] | null) ?? [], 'min');
  const total = count ?? 0;

  return {
    items,
    total,
    page,
    limit,
    has_more: page * limit < total,
  };
};

/**
 * Fetches active packages by id and maps them to list items in the same order as requested.
 */
export const getPackageListItemsByIds = async (
  ids: string[],
  pricingMode: PricingMode = 'min',
): Promise<PackageListItem[]> => {
  const uniqueIds = uniqueStrings(ids);

  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabasePublic
    .from('packages')
    .select(PACKAGE_LIST_SELECT)
    .in('id', uniqueIds)
    .eq('status', 'active');

  if (error !== null) {
    throwDatabaseError('getPackageListItemsByIds', error);
  }

  const items = await buildListItems((data as unknown[] | null) ?? [], pricingMode);
  const order = new Map(uniqueIds.map((id, index) => [id, index]));

  return items.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
};

/**
 * Fetches a single active package with gallery, itinerary, pricing, company, location, and category details.
 */
export const getPackageById = async (id: string): Promise<PackageDetail> => {
  const { data, error } = await supabasePublic
    .from('packages')
    .select(PACKAGE_DETAIL_SELECT)
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error !== null) {
    throwDatabaseError('getPackageById', error);
  }

  if (data === null) {
    throw new AppError('Package not found', 404);
  }

  const [imagesResult, itinerariesResult, pricingResult] = await Promise.all([
    supabasePublic
      .from('package_images')
      .select('id, package_id, url, public_id, alt_text, is_cover, display_order')
      .eq('package_id', id)
      .order('display_order', { ascending: true }),
    supabasePublic
      .from('itineraries')
      .select('id, package_id, day_number, title, description, meals, accommodation, activities, transport')
      .eq('package_id', id)
      .order('day_number', { ascending: true }),
    supabasePublic
      .from('package_pricing')
      .select(
        'id, package_id, label, min_people, max_people, base_price, discounted_price, currency, season, valid_from, valid_until, is_active',
      )
      .eq('package_id', id)
      .eq('is_active', true)
      .order('min_people', { ascending: true })
      .order('base_price', { ascending: true }),
  ]);

  if (imagesResult.error !== null) {
    throwDatabaseError('getPackageById.images', imagesResult.error);
  }

  if (itinerariesResult.error !== null) {
    throwDatabaseError('getPackageById.itineraries', itinerariesResult.error);
  }

  if (pricingResult.error !== null) {
    throwDatabaseError('getPackageById.pricing', pricingResult.error);
  }

  const record = toRecord(data);
  const packageEntity = mapPackage(record);

  return {
    ...packageEntity,
    images: ((imagesResult.data as unknown[] | null) ?? []).map(mapPackageImage),
    itineraries: ((itinerariesResult.data as unknown[] | null) ?? []).map(mapItinerary),
    pricing: ((pricingResult.data as unknown[] | null) ?? []).map(mapPackagePricing),
    company: mapDetailCompany(record.company),
    location: mapDetailLocation(record.location),
    category: mapDetailCategory(record.category),
  };
};

/**
 * Fetches up to four active packages for side-by-side comparison.
 */
export const getPackagesForCompare = async (ids: string[]): Promise<PackageListItem[]> => {
  return getPackageListItemsByIds(ids.slice(0, 4), 'all');
};

/**
 * Fetches featured active packages ordered by rating for the home screen.
 */
export const getFeaturedPackages = async (): Promise<PackageListItem[]> => {
  const { data, error } = await supabasePublic
    .from('packages')
    .select(PACKAGE_LIST_SELECT)
    .eq('status', 'active')
    .eq('is_featured', true)
    // Order by most recently featured first — ordering by avg_rating pushed
    // newly-featured packages with no reviews yet past the limit of 6,
    // so they never showed up in Trending Packages right after being featured.
    .order('updated_at', { ascending: false })
    .limit(6);

  if (error !== null) {
    throwDatabaseError('getFeaturedPackages', error);
  }

  return buildListItems((data as unknown[] | null) ?? [], 'min');
};

/**
 * Returns up to 6 active packages in the same category and location as the
 * given package, excluding itself. Falls back to same-category if not enough
 * location matches.
 */
export const getSimilarPackages = async (packageId: string): Promise<PackageListItem[]> => {
  // First fetch the source package to get its category and location
  const { data: src, error: srcErr } = await supabasePublic
    .from('packages')
    .select('category_id, location_id')
    .eq('id', packageId)
    .maybeSingle();

  if (srcErr !== null) throwDatabaseError('getSimilarPackages.source', srcErr);
  if (src === null) return [];

  const s = src as { category_id: string | null; location_id: string | null };

  // Try same category + same location first
  let { data, error } = await supabasePublic
    .from('packages')
    .select(PACKAGE_LIST_SELECT)
    .eq('status', 'active')
    .eq('category_id', s.category_id ?? '')
    .eq('location_id', s.location_id ?? '')
    .neq('id', packageId)
    .order('avg_rating', { ascending: false })
    .limit(6);

  if (error !== null) throwDatabaseError('getSimilarPackages.byLocation', error);

  // Fall back to same category only if < 3 results
  if ((data?.length ?? 0) < 3) {
    const fallback = await supabasePublic
      .from('packages')
      .select(PACKAGE_LIST_SELECT)
      .eq('status', 'active')
      .eq('category_id', s.category_id ?? '')
      .neq('id', packageId)
      .order('avg_rating', { ascending: false })
      .limit(6);

    if (fallback.error !== null) throwDatabaseError('getSimilarPackages.byCategory', fallback.error);
    data = fallback.data;
  }

  return buildListItems((data as unknown[] | null) ?? [], 'min');
};

/**
 * Applies computed badges to package list items without mutating the original objects.
 */
export const attachBadgesToPackages = (packages: PackageListItem[], badges: Badge[]): PackageListItem[] => {
  return packages.map((packageItem) => ({
    ...packageItem,
    badges: badges.filter((badge) => badge.package_id === packageItem.id),
  }));
};
