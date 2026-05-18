/**
 * Role assigned to an application user.
 */
export type UserRole = 'traveler' | 'company_owner' | 'admin';

/**
 * Public profile stored for a Supabase-authenticated user.
 */
export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/**
 * Travel destination metadata available for package discovery.
 */
export interface Location {
  id: string;
  city: string;
  state: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
}

/**
 * Package category used to group and filter travel experiences.
 */
export interface Category {
  id: string;
  name: string;
  label: string;
  icon: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

/**
 * Verified or pending travel operator profile.
 */
export interface Company {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  about: string | null;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  total_packages: number;
  created_at: string;
}

/**
 * Lifecycle status for a travel package.
 */
export type PackageStatus = 'draft' | 'pending' | 'active' | 'rejected';

/**
 * Core package entity as stored in the database.
 */
export interface Package {
  id: string;
  company_id: string;
  location_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string | null;
  highlights: string[];
  duration_days: number;
  duration_nights: number;
  min_group_size: number;
  max_group_size: number;
  inclusions: string[];
  exclusions: string[];
  amenities: string[];
  status: PackageStatus;
  is_featured: boolean;
  is_bestseller: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

/**
 * Price band for a package, optionally scoped by season and validity dates.
 */
export interface PackagePricing {
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

/**
 * Image belonging to a package gallery.
 */
export interface PackageImage {
  id: string;
  package_id: string;
  url: string;
  public_id: string;
  alt_text: string | null;
  is_cover: boolean;
  display_order: number;
}

/**
 * Day-level package itinerary item.
 */
export interface Itinerary {
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

/**
 * Complete package payload for the package detail screen.
 */
export interface PackageDetail extends Package {
  images: PackageImage[];
  itineraries: Itinerary[];
  pricing: PackagePricing[];
  company: Pick<
    Company,
    'id' | 'name' | 'slug' | 'logo_url' | 'is_verified' | 'avg_rating' | 'total_reviews'
  >;
  location: Pick<Location, 'id' | 'city' | 'state' | 'region'>;
  category: Pick<Category, 'id' | 'name' | 'label' | 'icon'>;
}

/**
 * Comparison badge assigned to a package by computed business rules.
 */
export interface Badge {
  type: 'best_value' | 'highest_rated' | 'most_inclusive';
  package_id: string;
}

/**
 * Compact package payload optimized for search, lists, wishlists, and compare cards.
 */
export interface PackageListItem extends Package {
  cover_image: string | null;
  company: Pick<Company, 'id' | 'name' | 'logo_url' | 'is_verified'>;
  location: Pick<Location, 'id' | 'city' | 'state'>;
  category: Pick<Category, 'id' | 'name' | 'label' | 'icon'>;
  pricing: Pick<PackagePricing, 'base_price' | 'discounted_price' | 'currency'>[];
  badges: Badge[];
}

/**
 * User-controlled package search and filter inputs.
 */
export interface SearchFilters {
  destination?: string;
  state?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  duration_days?: number;
  min_rating?: number;
  amenities?: string[];
  is_featured?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Standard pagination wrapper for list endpoints.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

/**
 * Standard API response envelope returned by all endpoints.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Supabase-authenticated user attached to protected Express requests.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}
