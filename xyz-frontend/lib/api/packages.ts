/**
 * @file lib/api/packages.ts
 * @description All Supabase queries related to travel packages.
 * Screens and hooks must use these functions and not query Supabase directly.
 */

import { supabase } from '../supabase';
import { Config } from '../../constants/config';
import type {
  ApiResponse,
  Package,
  PackageCategory,
  PackageImage,
  PackagePricing,
  SearchFilters,
} from '../../types';

/**
 * Builds a human-readable error message from an unknown error object.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Runtime guard for category names coming from the database.
 */
function isPackageCategory(value: unknown): value is PackageCategory {
  return (
    value === 'pilgrimage' ||
    value === 'adventure' ||
    value === 'leisure' ||
    value === 'honeymoon' ||
    value === 'family' ||
    value === 'wildlife' ||
    value === 'cultural'
  );
}

/**
 * Shared package list select. We embed related location/category/pricing rows
 * and then normalize them into the flatter Package shape the app expects.
 */
const PACKAGE_LIST_SELECT = `
  id,
  company_id,
  location_id,
  category_id,
  title,
  slug,
  description,
  highlights,
  duration_days,
  duration_nights,
  min_group_size,
  max_group_size,
  inclusions,
  exclusions,
  amenities,
  status,
  is_featured,
  is_bestseller,
  avg_rating,
  review_count,
  total_bookings,
  created_at,
  updated_at,
  locations!packages_location_id_fkey (
    city,
    state
  ),
  categories!packages_category_id_fkey (
    name,
    label
  ),
  package_pricing!inner (
    id,
    package_id,
    label,
    min_people,
    max_people,
    base_price,
    discounted_price,
    currency,
    season,
    valid_from,
    valid_until,
    is_active,
    created_at
  )
`;

type PackageRow = Record<string, unknown> & {
  package_pricing?: unknown;
  package_images?: unknown;
  locations?: unknown;
  categories?: unknown;
};

function normalizePricingRows(rawPricing: unknown): PackagePricing[] {
  if (!Array.isArray(rawPricing)) return [];

  return rawPricing
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: String(item.id ?? ''),
      package_id:
        typeof item.package_id === 'string' ? item.package_id : undefined,
      label: typeof item.label === 'string' ? item.label : 'Standard',
      min_people:
        typeof item.min_people === 'number' ? item.min_people : 1,
      max_people:
        typeof item.max_people === 'number' ? item.max_people : 1,
      base_price:
        typeof item.base_price === 'number' ? item.base_price : 0,
      discounted_price:
        typeof item.discounted_price === 'number' ? item.discounted_price : null,
      currency: typeof item.currency === 'string' ? item.currency : 'INR',
      season:
        item.season === 'peak' || item.season === 'off-peak' || item.season === 'all'
          ? (item.season as 'all' | 'peak' | 'off-peak')
          : 'all',
      valid_from:
        typeof item.valid_from === 'string' ? item.valid_from : null,
      valid_until:
        typeof item.valid_until === 'string' ? item.valid_until : null,
      is_active: item.is_active !== false,
      created_at:
        typeof item.created_at === 'string'
          ? item.created_at
          : new Date(0).toISOString(),
    }))
    .filter((item) => item.is_active)
    .sort((a, b) => {
      if (a.min_people !== b.min_people) return a.min_people - b.min_people;
      return a.base_price - b.base_price;
    });
}

function normalizeImageRows(rawImages: unknown): PackageImage[] {
  if (!Array.isArray(rawImages)) return [];

  return rawImages
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: String(item.id ?? ''),
      package_id: String(item.package_id ?? ''),
      url: typeof item.url === 'string' ? item.url : '',
      public_id: typeof item.public_id === 'string' ? item.public_id : '',
      alt_text: typeof item.alt_text === 'string' ? item.alt_text : null,
      is_cover: item.is_cover === true,
      display_order:
        typeof item.display_order === 'number' ? item.display_order : 0,
      uploaded_by:
        typeof item.uploaded_by === 'string' ? item.uploaded_by : null,
      created_at:
        typeof item.created_at === 'string'
          ? item.created_at
          : new Date(0).toISOString(),
    }))
    .sort((a, b) => a.display_order - b.display_order);
}

function normalizePackageRow(row: PackageRow): Package {
  const location =
    typeof row.locations === 'object' && row.locations !== null
      ? (row.locations as Record<string, unknown>)
      : null;

  const category =
    typeof row.categories === 'object' && row.categories !== null
      ? (row.categories as Record<string, unknown>)
      : null;

  const pricing = normalizePricingRows(row.package_pricing);
  const primaryPricing = pricing[0] ?? null;
  const categoryName = category?.name;

  return {
    id: String(row.id ?? ''),
    company_id: String(row.company_id ?? ''),
    location_id: String(row.location_id ?? ''),
    category_id: String(row.category_id ?? ''),
    title: typeof row.title === 'string' ? row.title : '',
    slug: typeof row.slug === 'string' ? row.slug : '',
    description: typeof row.description === 'string' ? row.description : null,
    highlights: Array.isArray(row.highlights)
      ? row.highlights.filter((item): item is string => typeof item === 'string')
      : [],
    destination:
      typeof location?.city === 'string' ? location.city : '',
    state:
      typeof location?.state === 'string' ? location.state : '',
    category: isPackageCategory(categoryName) ? categoryName : null,
    category_label:
      typeof category?.label === 'string' ? category.label : null,
    duration_days:
      typeof row.duration_days === 'number' ? row.duration_days : 0,
    duration_nights:
      typeof row.duration_nights === 'number' ? row.duration_nights : 0,
    min_group_size:
      typeof row.min_group_size === 'number' ? row.min_group_size : 1,
    max_group_size:
      typeof row.max_group_size === 'number' ? row.max_group_size : 1,
    inclusions: Array.isArray(row.inclusions)
      ? row.inclusions.filter((item): item is string => typeof item === 'string')
      : [],
    exclusions: Array.isArray(row.exclusions)
      ? row.exclusions.filter((item): item is string => typeof item === 'string')
      : [],
    amenities: Array.isArray(row.amenities)
      ? row.amenities.filter((item): item is string => typeof item === 'string')
      : [],
    status:
      row.status === 'draft' ||
      row.status === 'pending' ||
      row.status === 'active' ||
      row.status === 'rejected'
        ? row.status
        : 'draft',
    is_featured: row.is_featured === true,
    is_bestseller: row.is_bestseller === true,
    rating: typeof row.avg_rating === 'number' ? row.avg_rating : 0,
    avg_rating: typeof row.avg_rating === 'number' ? row.avg_rating : 0,
    review_count:
      typeof row.review_count === 'number' ? row.review_count : 0,
    total_bookings:
      typeof row.total_bookings === 'number' ? row.total_bookings : 0,
    price: primaryPricing?.base_price ?? null,
    discounted_price: primaryPricing?.discounted_price ?? null,
    pricing,
    created_at:
      typeof row.created_at === 'string'
        ? row.created_at
        : new Date(0).toISOString(),
    updated_at:
      typeof row.updated_at === 'string'
        ? row.updated_at
        : new Date(0).toISOString(),
  };
}

async function resolveCategoryId(
  category: PackageCategory
): Promise<ApiResponse<string>> {
  const categoryResponse = await supabase
    .from('categories')
    .select('id')
    .eq('name', category)
    .maybeSingle();

  if (categoryResponse.error) {
    return {
      data: null,
      error: `Failed to resolve category: ${categoryResponse.error.message}`,
    };
  }

  if (!categoryResponse.data?.id) {
    return {
      data: null,
      error: `Category "${category}" was not found.`,
    };
  }

  return { data: String(categoryResponse.data.id), error: null };
}

/**
 * Fetches a paginated, filtered list of active travel packages.
 */
export async function searchPackages(
  filters: SearchFilters = {},
  page: number = 0
): Promise<ApiResponse<Package[]>> {
  try {
    const from = page * Config.packagesPageSize;
    const to = from + Config.packagesPageSize - 1;

    let query = supabase
      .from('packages')
      .select(PACKAGE_LIST_SELECT)
      .eq('status', 'active')
      .eq('package_pricing.is_active', true)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (filters.destination && filters.destination.trim().length > 0) {
      query = query.textSearch('fts', filters.destination.trim(), {
        type: 'websearch',
        config: 'english',
      });
    }

    if (filters.category) {
      const categoryIdResponse = await resolveCategoryId(filters.category);
      if (categoryIdResponse.error) {
        return { data: null, error: categoryIdResponse.error };
      }
      query = query.eq('category_id', categoryIdResponse.data);
    }

    if (filters.duration_days !== undefined) {
      query = query.eq('duration_days', filters.duration_days);
    }

    if (filters.min_rating !== undefined) {
      query = query.gte('avg_rating', filters.min_rating);
    }

    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
    }

    if (filters.min_price !== undefined) {
      query = query.gte('package_pricing.base_price', filters.min_price);
    }

    if (filters.max_price !== undefined) {
      query = query.lte('package_pricing.base_price', filters.max_price);
    }

    const queryResponse = await query;

    if (queryResponse.error) {
      return {
        data: null,
        error: `Failed to fetch packages: ${queryResponse.error.message}`,
      };
    }

    const packages = (queryResponse.data ?? []).map((row) =>
      normalizePackageRow(row as PackageRow)
    );

    return { data: packages, error: null };
  } catch (err) {
    return { data: null, error: `searchPackages: ${extractErrorMessage(err)}` };
  }
}

/**
 * Fetches a single active package by ID, including its images.
 */
export async function getPackageById(
  packageId: string
): Promise<ApiResponse<Package & { images: PackageImage[] }>> {
  try {
    if (!packageId || packageId.trim().length === 0) {
      return { data: null, error: 'Package ID is required.' };
    }

    const queryResponse = await supabase
      .from('packages')
      .select(
        `${PACKAGE_LIST_SELECT},
        package_images (
          id,
          package_id,
          url,
          public_id,
          alt_text,
          is_cover,
          display_order,
          uploaded_by,
          created_at
        )`
      )
      .eq('id', packageId)
      .eq('status', 'active')
      .eq('package_pricing.is_active', true)
      .single();

    if (queryResponse.error) {
      return {
        data: null,
        error: `Failed to fetch package: ${queryResponse.error.message}`,
      };
    }

    if (!queryResponse.data) {
      return { data: null, error: 'Package not found.' };
    }

    const packageRow = queryResponse.data as PackageRow;
    const images = normalizeImageRows(packageRow.package_images);
    const packageData = normalizePackageRow(packageRow);

    return {
      data: { ...packageData, images },
      error: null,
    };
  } catch (err) {
    return { data: null, error: `getPackageById: ${extractErrorMessage(err)}` };
  }
}

/**
 * Fetches featured/promoted packages for the home screen.
 */
export async function getFeaturedPackages(): Promise<ApiResponse<Package[]>> {
  try {
    const queryResponse = await supabase
      .from('packages')
      .select(PACKAGE_LIST_SELECT)
      .eq('status', 'active')
      .eq('package_pricing.is_active', true)
      .order('is_featured', { ascending: false })
      .order('is_bestseller', { ascending: false })
      .order('avg_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(10);

    if (queryResponse.error) {
      return {
        data: null,
        error: `Failed to fetch featured packages: ${queryResponse.error.message}`,
      };
    }

    const packages = (queryResponse.data ?? []).map((row) =>
      normalizePackageRow(row as PackageRow)
    );

    return { data: packages, error: null };
  } catch (err) {
    return {
      data: null,
      error: `getFeaturedPackages: ${extractErrorMessage(err)}`,
    };
  }
}

/**
 * Fetches packages belonging to a specific category.
 */
export async function getPackagesByCategory(
  category: PackageCategory,
  limit: number = 10
): Promise<ApiResponse<Package[]>> {
  try {
    const categoryIdResponse = await resolveCategoryId(category);
    if (categoryIdResponse.error) {
      return { data: null, error: categoryIdResponse.error };
    }

    const queryResponse = await supabase
      .from('packages')
      .select(PACKAGE_LIST_SELECT)
      .eq('status', 'active')
      .eq('category_id', categoryIdResponse.data)
      .eq('package_pricing.is_active', true)
      .order('avg_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit);

    if (queryResponse.error) {
      return {
        data: null,
        error: `Failed to fetch packages for category "${category}": ${queryResponse.error.message}`,
      };
    }

    const packages = (queryResponse.data ?? []).map((row) =>
      normalizePackageRow(row as PackageRow)
    );

    return { data: packages, error: null };
  } catch (err) {
    return {
      data: null,
      error: `getPackagesByCategory: ${extractErrorMessage(err)}`,
    };
  }
}
