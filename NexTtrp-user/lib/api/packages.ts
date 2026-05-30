/**
 * @file lib/api/packages.ts
 * @description Package API wrappers backed by the Express backend.
 */

import { apiClient } from './client';
import type { QueryParams } from './client';
import type {
  ApiResponse,
  Package,
  PackageCategory,
  PackageDetail,
  PackageImage,
  PackageListItem,
  PackagePricing,
  PaginatedResponse,
  SearchFilters,
} from '../../types';

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

function mapListPricing(
  packageId: string,
  pricing: PackageListItem['pricing']
): PackagePricing[] {
  return pricing.map((item, index) => ({
    id: `${packageId}-pricing-${index}`,
    package_id: packageId,
    label: 'Standard',
    min_people: 1,
    max_people: 1,
    base_price: item.base_price,
    discounted_price: item.discounted_price,
    currency: item.currency,
    season: 'all',
    valid_from: null,
    valid_until: null,
    is_active: true,
    created_at: '',
  }));
}

function mapDetailPricing(pricing: PackageDetail['pricing']): PackagePricing[] {
  return pricing.map((item) => ({
    id: item.id,
    package_id: item.package_id,
    label: item.label,
    min_people: item.min_people,
    max_people: item.max_people,
    base_price: item.base_price,
    discounted_price: item.discounted_price,
    currency: item.currency,
    season: item.season,
    valid_from: item.valid_from,
    valid_until: item.valid_until,
    is_active: item.is_active,
    created_at: '',
  }));
}

function pricingSummary(pricing: PackagePricing[]): {
  price: number | null;
  discounted_price: number | null;
} {
  const sorted = [...pricing].sort((left, right) => {
    const leftPrice = left.discounted_price ?? left.base_price;
    const rightPrice = right.discounted_price ?? right.base_price;
    return leftPrice - rightPrice;
  });
  const primary = sorted[0] ?? null;

  return {
    price: primary?.base_price ?? null,
    discounted_price: primary?.discounted_price ?? null,
  };
}

function mapPackageListItem(item: PackageListItem): Package {
  const pricing = mapListPricing(item.id, item.pricing);
  const summary = pricingSummary(pricing);

  return {
    id: item.id,
    company_id: item.company_id,
    location_id: item.location_id,
    category_id: item.category_id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    highlights: item.highlights,
    destination: item.location.city,
    state: item.location.state,
    category: isPackageCategory(item.category.name) ? item.category.name : null,
    category_label: item.category.label,
    duration_days: item.duration_days,
    duration_nights: item.duration_nights,
    min_group_size: item.min_group_size,
    max_group_size: item.max_group_size,
    inclusions: item.inclusions,
    exclusions: item.exclusions,
    amenities: item.amenities,
    status: item.status,
    is_featured: item.is_featured,
    is_bestseller: item.is_bestseller,
    rating: item.avg_rating,
    avg_rating: item.avg_rating,
    review_count: item.review_count,
    total_bookings: item.total_bookings,
    price: summary.price,
    discounted_price: summary.discounted_price,
    pricing,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function mapPackageDetail(detail: PackageDetail): Package & { images: PackageImage[] } {
  const pricing = mapDetailPricing(detail.pricing);
  const summary = pricingSummary(pricing);

  return {
    id: detail.id,
    company_id: detail.company_id,
    location_id: detail.location_id,
    category_id: detail.category_id,
    title: detail.title,
    slug: detail.slug,
    description: detail.description,
    highlights: detail.highlights,
    destination: detail.location.city,
    state: detail.location.state,
    category: isPackageCategory(detail.category.name) ? detail.category.name : null,
    category_label: detail.category.label,
    duration_days: detail.duration_days,
    duration_nights: detail.duration_nights,
    min_group_size: detail.min_group_size,
    max_group_size: detail.max_group_size,
    inclusions: detail.inclusions,
    exclusions: detail.exclusions,
    amenities: detail.amenities,
    status: detail.status,
    is_featured: detail.is_featured,
    is_bestseller: detail.is_bestseller,
    rating: detail.avg_rating,
    avg_rating: detail.avg_rating,
    review_count: detail.review_count,
    total_bookings: detail.total_bookings,
    price: summary.price,
    discounted_price: summary.discounted_price,
    pricing,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
    images: detail.images,
  };
}

function mapSearchFilters(filters: SearchFilters, page: number): QueryParams {
  return {
    category: filters.category,
    destination: filters.destination,
    duration_days: filters.duration_days,
    max_price: filters.max_price,
    min_price: filters.min_price,
    min_rating: filters.min_rating,
    amenities: filters.amenities?.join(','),
    page: page + 1,
  };
}

/**
 * Fetches a paginated, filtered list of active travel packages.
 */
// FIXED: 6 - Package discovery now goes through GET /api/v1/packages.
export async function searchPackages(
  filters: SearchFilters = {},
  page: number = 0
): Promise<ApiResponse<Package[]>> {
  const response = await apiClient.get<PaginatedResponse<PackageListItem>>(
    '/packages',
    mapSearchFilters(filters, page),
    false
  );

  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to fetch packages.' };
  }

  return {
    data: response.data.items.map(mapPackageListItem),
    error: null,
  };
}

/**
 * Fetches a single active package by ID, including images.
 */
// FIXED: 6 - Package detail now goes through GET /api/v1/packages/:id.
export async function getPackageById(
  packageId: string
): Promise<ApiResponse<Package & { images: PackageImage[] }>> {
  if (!packageId || packageId.trim().length === 0) {
    return { data: null, error: 'Package ID is required.' };
  }

  const response = await apiClient.get<PackageDetail>(
    `/packages/${encodeURIComponent(packageId)}`,
    undefined,
    false
  );

  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Package not found.' };
  }

  return {
    data: mapPackageDetail(response.data),
    error: null,
  };
}

/**
 * Fetches the raw PackageDetail for a single package by ID (no field mapping).
 * Use this when the caller needs the full backend shape, not the mapped Package type.
 */
export async function getPackageDetail(
  packageId: string
): Promise<ApiResponse<PackageDetail>> {
  if (!packageId || packageId.trim().length === 0) {
    return { data: null, error: 'Package ID is required.' };
  }

  const response = await apiClient.get<PackageDetail>(
    `/packages/${encodeURIComponent(packageId)}`,
    undefined,
    false
  );

  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Package not found.' };
  }

  return { data: response.data, error: null };
}

/**
 * Fetches featured/promoted packages for the home screen.
 */
// FIXED: 6 - Featured packages now use the backend API.
export async function getFeaturedPackages(): Promise<ApiResponse<Package[]>> {
  const response = await apiClient.get<PackageListItem[]>(
    '/packages/featured',
    undefined,
    false
  );

  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to fetch featured packages.' };
  }

  return {
    data: response.data.map(mapPackageListItem),
    error: null,
  };
}

/**
 * Fetches packages belonging to a specific category.
 */
// FIXED: 6 - Category package lists now use GET /api/v1/packages filters.
export async function getPackagesByCategory(
  category: PackageCategory,
  limit: number = 10
): Promise<ApiResponse<Package[]>> {
  const response = await apiClient.get<PaginatedResponse<PackageListItem>>(
    '/packages',
    { category, limit, page: 1 },
    false
  );

  if (response.error || !response.data) {
    return {
      data: null,
      error: response.error ?? `Failed to fetch packages for category "${category}".`,
    };
  }

  return {
    data: response.data.items.map(mapPackageListItem),
    error: null,
  };
}
