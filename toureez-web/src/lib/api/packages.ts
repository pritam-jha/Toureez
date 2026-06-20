import { apiClient } from './client';

export interface PackageSummary {
  id: string;
  title: string;
  description?: string;
  cover_image?: string | null;
  location?: { id: string; city: string; state?: string } | string;
  category?: { id: string; name: string; label?: string } | string;
  duration_days?: number;
  pricing?: { id?: string; base_price: number; discounted_price?: number; currency?: string }[];
  avg_rating?: number;
  review_count?: number;
  is_featured?: boolean;
  status?: string;
  company?: { id: string; name: string; logo_url?: string | null; is_verified?: boolean };
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  amenities?: string[];
  min_group_size?: number;
  max_group_size?: number;
  [key: string]: unknown;
}

/** Backend returns location/category as nested objects; this normalizes them to display strings. */
export function packageLocationLabel(pkg: PackageSummary): string {
  if (!pkg.location) return '';
  if (typeof pkg.location === 'string') return pkg.location;
  return [pkg.location.city, pkg.location.state].filter(Boolean).join(', ');
}

export function packagePrice(pkg: PackageSummary): number | undefined {
  return pkg.pricing?.[0]?.discounted_price ?? pkg.pricing?.[0]?.base_price;
}

/** Only present on the single-package detail endpoint — list/search/featured endpoints don't select it. */
export function packagePricingId(pkg: PackageSummary): string | undefined {
  return pkg.pricing?.[0]?.id;
}

export function packageCoverImage(pkg: PackageSummary): string | null {
  return pkg.cover_image ?? null;
}

export function packageVendorName(pkg: PackageSummary): string {
  return pkg.company?.name ?? '';
}

export interface SearchPackagesParams {
  destination?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  featured?: boolean;
  sort?: 'best_match' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  pageSize?: number;
}

export interface PaginatedPackages {
  items: PackageSummary[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export async function searchPackages(params: SearchPackagesParams) {
  return apiClient.get<PaginatedPackages>('/packages', {
    destination: params.destination,
    category: params.category,
    min_price: params.minPrice,
    max_price: params.maxPrice,
    min_rating: params.minRating,
    featured: params.featured,
    sort: params.sort,
    page: params.page,
    page_size: params.pageSize,
  });
}

export async function getFeaturedPackages() {
  return apiClient.get<PackageSummary[]>('/packages/featured');
}

export async function getPackagesForCompare(ids: string[]) {
  return apiClient.get<PackageSummary[]>('/packages/compare', { ids: ids.join(',') });
}

export async function getPackageDetail(id: string) {
  return apiClient.get<PackageSummary>(`/packages/${id}`);
}

export async function getSimilarPackages(id: string) {
  return apiClient.get<PackageSummary[]>(`/packages/${id}/similar`);
}
