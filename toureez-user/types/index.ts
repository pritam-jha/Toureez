/**
 * @file types/index.ts
 * @description Central type definitions for the Toureez travel app.
 * All interfaces are defined here and imported across the codebase
 * to ensure a single source of truth for data shapes.
 */

import type { Session } from '@supabase/supabase-js';

// ============================================================
// DOMAIN TYPES
// ============================================================

/**
 * Represents a registered user profile, extending Supabase auth.users.
 */
// FIXED: 1 - Frontend users carry the same role enum stored in public.users.role.
export type UserRole = 'traveler' | 'company_owner' | 'admin';

// FIXED: 2 - The DB enum uses company_owner; reserve "Vendor" for UI labels.
export const VENDOR_ROLE = 'company_owner' as const;

export interface User {
  /** UUID from auth.users */
  id: string;
  /** User's display name */
  full_name: string | null;
  /** Cloudinary URL for avatar */
  avatar_url: string | null;
  /** Indian mobile number */
  phone: string | null;
  /** User's city */
  city: string | null;
  /** User's state (Indian state) */
  state: string | null;
  /** Authorization role from public.users.role */
  // FIXED: 1 - Auth routing reads this role after login/profile hydration.
  role: UserRole;
  /** ISO timestamp of account creation */
  created_at: string;
}

/**
 * Represents a travel company registered on the platform.
 */
export interface Company {
  /** UUID primary key */
  id: string;
  /** UUID of the owning auth.user */
  owner_id: string;
  /** Company display name */
  name: string;
  /** Cloudinary URL for company logo */
  logo_url: string | null;
  /** Cloudinary URL for company cover image */
  cover_url: string | null;
  /** Company description / about text */
  about: string | null;
  /** GST registration number */
  gst_number: string | null;
  /** Cloudinary URL for trade license document */
  trade_license_url: string | null;
  /** Admin-controlled approval status */
  status: 'pending' | 'approved' | 'rejected';
  /** Whether the company has been verified by the platform */
  is_verified: boolean;
  /** ISO timestamp of company creation */
  created_at: string;
}

/**
 * Travel package category options.
 */
export type PackageCategory =
  | 'pilgrimage'
  | 'adventure'
  | 'leisure'
  | 'honeymoon'
  | 'family'
  | 'wildlife'
  | 'cultural';

/**
 * Travel package lifecycle status.
 */
export type PackageStatus = 'draft' | 'pending' | 'active' | 'rejected';

/**
 * Represents one pricing tier for a travel package.
 */
export interface PackagePricing {
  /** UUID primary key */
  id: string;
  /** UUID of the associated package */
  package_id?: string;
  /** Display label, e.g. Standard / Group */
  label: string;
  /** Min travellers covered by this tier */
  min_people: number;
  /** Max travellers covered by this tier */
  max_people: number;
  /** Base price in INR */
  base_price: number;
  /** Discounted price in INR, if any */
  discounted_price: number | null;
  /** Currency code */
  currency: string;
  /** Pricing season */
  season: 'all' | 'peak' | 'off-peak';
  /** Optional validity start */
  valid_from?: string | null;
  /** Optional validity end */
  valid_until?: string | null;
  /** Whether the pricing row is active */
  is_active: boolean;
  /** ISO timestamp */
  created_at: string;
}

/**
 * Represents a travel package listed by a company.
 * Includes both raw schema fields and a few UI-friendly derived fields.
 */
export interface Package {
  /** UUID primary key */
  id: string;
  /** UUID of the owning company */
  company_id: string;
  /** Foreign key to locations */
  location_id: string;
  /** Foreign key to categories */
  category_id: string;
  /** Package title */
  title: string;
  /** URL slug */
  slug: string;
  /** Detailed description */
  description: string | null;
  /** Marketing highlights */
  highlights: string[];
  /** Primary destination name derived from locations.city */
  destination: string;
  /** Indian state derived from locations.state */
  state: string;
  /** Package category derived from categories.name */
  category: PackageCategory | null;
  /** Human label derived from categories.label */
  category_label: string | null;
  /** Trip duration in days */
  duration_days: number;
  /** Trip duration in nights */
  duration_nights: number;
  /** Minimum allowed group size */
  min_group_size: number;
  /** Maximum allowed group size */
  max_group_size: number;
  /** List of included services/items */
  inclusions: string[];
  /** List of excluded services/items */
  exclusions: string[];
  /** List of amenities provided */
  amenities: string[];
  /** Package lifecycle status */
  status: PackageStatus;
  /** Whether admins marked this as featured */
  is_featured: boolean;
  /** Whether admins marked this as bestseller */
  is_bestseller: boolean;
  /** Average rating derived from the raw avg_rating column */
  rating: number;
  /** Raw average rating from the database */
  avg_rating: number;
  /** Total number of reviews */
  review_count: number;
  /** Total confirmed bookings */
  total_bookings: number;
  /** Lowest active base price derived from pricing rows */
  price: number | null;
  /** Lowest active discounted price derived from pricing rows */
  discounted_price: number | null;
  /** Active pricing tiers */
  pricing: PackagePricing[];
  /** ISO timestamp of package creation */
  created_at: string;
  /** ISO timestamp of last update */
  updated_at: string;
}

/**
 * Represents an image associated with a travel package.
 */
export interface PackageImage {
  /** UUID primary key */
  id: string;
  /** UUID of the associated package */
  package_id: string;
  /** Cloudinary delivery URL */
  url: string;
  /** Cloudinary public_id for transformations/deletion */
  public_id: string;
  /** Optional alt text */
  alt_text?: string | null;
  /** Whether this is the cover/hero image */
  is_cover: boolean;
  /** Sort order for image gallery */
  display_order: number;
  /** Optional uploader UUID */
  uploaded_by?: string | null;
  /** ISO timestamp */
  created_at: string;
}

/**
 * Represents a wishlist entry linking a user to a package.
 */
export interface Wishlist {
  /** UUID primary key */
  id: string;
  /** UUID of the user */
  user_id: string;
  /** UUID of the wishlisted package */
  package_id: string;
  /** ISO timestamp when added */
  created_at: string;
}

// ============================================================
// SEARCH & FILTER TYPES
// ============================================================

/**
 * Filter parameters for the package search screen.
 * All fields are optional — only provided fields are applied.
 */
export interface SearchFilters {
  /** Destination name (partial match supported) */
  destination?: string;
  /** Minimum price in INR */
  min_price?: number;
  /** Maximum price in INR */
  max_price?: number;
  /** Exact trip duration in days */
  duration_days?: number;
  /** Package category filter */
  category?: PackageCategory;
  /** Minimum average rating */
  min_rating?: number;
  /** Required amenities (all must match) */
  amenities?: string[];
}

// ============================================================
// API RESPONSE TYPE
// ============================================================

/**
 * Standardised API response wrapper used by all lib/api/* functions.
 * Ensures consistent error handling across the app — callers always
 * check `error` before using `data`.
 *
 * @template T - The shape of the successful response payload.
 */
export interface ApiResponse<T> {
  /** The response payload, or null if an error occurred */
  data: T | null;
  /** Human-readable error message, or null on success */
  error: string | null;
}

// ============================================================
// STORE STATE TYPES
// ============================================================

/**
 * Shape of the Zustand auth store state and actions.
 */
export interface AuthState {
  /** The currently authenticated user, or null if logged out */
  user: User | null;
  /**
   * The raw Supabase session object, or null if logged out.
   * Contains the JWT access_token needed for authenticated requests
   * to non-Supabase services (e.g. custom backend, signed Cloudinary uploads).
   */
  session: Session | null;
  /** Whether the auth state has been resolved from AsyncStorage */
  isLoading: boolean;
  /** Set the current user (called after login/signup) */
  setUser: (user: User | null) => void;
  /**
   * Atomically sets both the user profile and the raw session.
   * Prefer this over setUser when both values are available to avoid
   * a render cycle where user is set but session is still null.
   */
  setSession: (user: User | null, session: Session | null) => void;
  /** Mark auth loading as complete */
  setLoading: (loading: boolean) => void;
  /** Clear both user and session state on logout */
  clearUser: () => void;
}

/**
 * Shape of the Zustand wishlist store state and actions.
 */
export interface WishlistState {
  /** Set of package IDs the user has wishlisted (for O(1) lookup) */
  wishlistedIds: Set<string>;
  /** Set of destination IDs the user has saved locally */
  wishlistedDestinationIds: Set<string>;
  /** Destination metadata needed to render locally saved destinations */
  wishlistedDestinations: Location[];
  /** Add a package ID to the local wishlist cache */
  addToWishlist: (packageId: string) => void;
  /** Remove a package ID from the local wishlist cache */
  removeFromWishlist: (packageId: string) => void;
  /** Add a destination to the local wishlist cache */
  addDestinationToWishlist: (destination: Location) => void;
  /** Remove a destination from the local wishlist cache */
  removeDestinationFromWishlist: (destinationId: string) => void;
  /** Toggle a destination in the local wishlist cache */
  toggleDestinationWishlist: (destination: Location) => void;
  /** Replace the entire wishlist cache (used on initial load) */
  setWishlist: (packageIds: string[]) => void;
  /** Check if a package is wishlisted */
  isWishlisted: (packageId: string) => boolean;
  /** Check if a destination is wishlisted */
  isDestinationWishlisted: (destinationId: string) => boolean;
}

/**
 * Shape of the Zustand compare store state and actions.
 * Maximum 4 packages can be compared simultaneously.
 */
export interface CompareState {
  /** Packages currently in the comparison tray (max 4) */
  compareItems: ComparePackage[];
  /** Add a package to the comparison tray */
  addToCompare: (pkg: ComparePackage) => void;
  /** Remove a package from the comparison tray by ID */
  removeFromCompare: (packageId: string) => void;
  /** Clear the entire comparison tray */
  clearCompare: () => void;
  /** Check if a package is already in the tray */
  isInCompare: (packageId: string) => boolean;
}

// ============================================================
// BACKEND API TYPES (from Node.js/Express backend)
// ============================================================

/**
 * Travel destination as returned by GET /api/v1/locations
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
 * Package category as returned by GET /api/v1/categories
 */
export interface Category {
  id: string;
  /** Internal name slug, e.g. 'pilgrimage' */
  name: string;
  /** Human-readable label, e.g. 'Pilgrimage' */
  label: string;
  /** Emoji or icon identifier */
  icon: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

/**
 * Comparison badge assigned by backend business rules.
 */
export interface Badge {
  type: 'best_value' | 'highest_rated' | 'most_inclusive';
  package_id: string;
}

/**
 * Compact package shape returned by list/search/featured endpoints.
 * Includes denormalised company, location, category, and pricing.
 */
export interface PackageListItem {
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
  status: 'draft' | 'pending' | 'active' | 'rejected';
  is_featured: boolean;
  is_bestseller: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
  /** Cloudinary URL of the cover image */
  cover_image: string | null;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    is_verified: boolean;
  };
  location: {
    id: string;
    city: string;
    state: string;
  };
  category: {
    id: string;
    name: string;
    label: string;
    icon: string;
  };
  pricing: {
    base_price: number;
    discounted_price: number | null;
    currency: string;
  }[];
  badges: Badge[];
}

/**
 * Compact package payload persisted in the compare tray.
 * It keeps the floating tray fast while retaining enough metadata for
 * immediate comparison UI before the compare screen refetches fresh data.
 */
export interface ComparePackage {
  id: string;
  title: string;
  cover_image: string | null;
  duration_days: number;
  duration_nights: number;
  avg_rating: number;
  review_count: number;
  is_featured: boolean;
  is_bestseller: boolean;
  company: PackageListItem['company'];
  location: PackageListItem['location'];
  category: PackageListItem['category'];
  pricing: PackageListItem['pricing'];
}

/**
 * Day-level itinerary item returned by GET /api/v1/packages/:id
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
 * Complete package payload returned by GET /api/v1/packages/:id
 * Extends PackageListItem with images, itineraries, full pricing,
 * and enriched company/location/category objects.
 */
export interface PackageDetail {
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
  status: 'draft' | 'pending' | 'active' | 'rejected';
  is_featured: boolean;
  is_bestseller: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
  images: PackageImage[];
  itineraries: Itinerary[];
  pricing: {
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
  }[];
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    is_verified: boolean;
    avg_rating: number;
    total_reviews: number;
    /** UUID of the Supabase auth user who owns this company. Used for "Manage Photos" visibility. */
    owner_id: string;
  };
  location: {
    id: string;
    city: string;
    state: string;
    region: string;
  };
  category: {
    id: string;
    name: string;
    label: string;
    icon: string;
  };
}

/**
 * Standard API response envelope from the Node.js backend.
 */
export interface BackendApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

/**
 * Notification events supported by the notifications table and mobile UI.
 */
export type AppNotificationType =
  | 'booking_confirmed'
  | 'payment_received'
  | 'review_received'
  | 'package_approved'
  | 'wishlist_price_drop';

/**
 * Entity types that can be opened from a notification.
 */
export type AppNotificationRelatedType = 'booking' | 'package' | 'review';

/**
 * User-facing notification returned by GET /api/v1/notifications.
 */
export interface AppNotification {
  id: string;
  user_id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  related_id: string | null;
  related_type: AppNotificationRelatedType | null;
  is_read: boolean;
  created_at: string;
}

/**
 * Date bucket shown on the notifications screen.
 */
export interface NotificationSection {
  key: 'today' | 'yesterday' | 'earlier';
  title: 'Today' | 'Yesterday' | 'Earlier';
  notifications: AppNotification[];
}

// ============================================================
// BOOKING TYPES
// ============================================================

/**
 * Individual traveler details collected during booking.
 */
export interface TravelerDetail {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  id_type: 'aadhaar' | 'passport' | 'driving_license';
  id_number: string;
  is_primary: boolean;
}

/**
 * Full booking entity as returned by GET /api/v1/bookings/:id
 */
export interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  company_id: string;
  pricing_id: string;
  booking_reference: string;
  travel_date: string;
  num_travelers: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  special_requests: string | null;
  traveler_details: TravelerDetail[];
  created_at: string;
  updated_at: string;
  package?: {
    id: string;
    title: string;
    cover_image: string | null;
    duration_days: number;
    duration_nights: number;
    location: { city: string; state: string };
  };
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    is_verified: boolean;
  };
  payment?: {
    amount_paid: number;
    payment_method: string | null;
    paid_at: string | null;
    payment_type: 'full' | 'advance';
  };
}

/**
 * Compact booking shape for the bookings list screen.
 */
export interface BookingSummary {
  id: string;
  booking_reference: string;
  travel_date: string;
  num_travelers: number;
  total_amount: number;
  status: Booking['status'];
  payment_status: Booking['payment_status'];
  package: {
    id: string;
    title: string;
    cover_image: string | null;
    duration_days: number;
    location: { city: string; state: string };
  };
  company: { name: string; logo_url: string | null };
  created_at: string;
}

/**
 * Input payload for POST /api/v1/bookings/create
 */
export interface CreateBookingInput {
  package_id: string;
  pricing_id: string;
  travel_date: string;
  num_travelers: number;
  special_requests?: string;
  traveler_details: TravelerDetail[];
  payment_type: 'full' | 'advance';
  primary_contact: {
    full_name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
  };
}

/**
 * Client-side price calculation result.
 * Mirrors the backend calculation for display before the API call.
 */
export interface PriceCalculation {
  base_price: number;
  num_travelers: number;
  subtotal: number;
  group_discount: number;
  gst: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  payment_type: 'full' | 'advance';
}

/**
 * Primary contact details collected on the booking form.
 */
export interface PrimaryContact {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  special_requests: string;
}

/**
 * Complete booking form state passed between booking screens.
 */
export interface BookingFormState {
  packageId: string;
  pricingId: string;
  travelDate: string;
  numTravelers: number;
  primaryContact: PrimaryContact;
  travelers: TravelerDetail[];
  paymentType: 'full' | 'advance';
  priceCalculation: PriceCalculation | null;
}

/**
 * Standard pagination wrapper returned by list endpoints on the Node.js backend.
 * Mirrors the backend's PaginatedResponse<T> type exactly.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================
// REVIEW TYPES
// ============================================================

/**
 * A single review submitted by a verified traveler after a completed booking.
 * Sub-ratings are optional — at least one must be provided.
 */
export interface ReviewImage {
  url: string;
  public_id: string;
}

export interface Review {
  /** UUID primary key */
  id: string;
  /** UUID of the booking this review is tied to */
  booking_id: string;
  /** UUID of the reviewer */
  user_id: string;
  /** UUID of the reviewed package */
  package_id: string;
  /** Guide / Tour Manager rating (1–5) */
  rating_guide: number | null;
  /** Hotel / Accommodation rating (1–5) */
  rating_hotel: number | null;
  /** Food & Meals rating (1–5) */
  rating_food: number | null;
  /** Transport rating (1–5) */
  rating_transport: number | null;
  /** Value for Money rating (1–5) */
  rating_value: number | null;
  /** Computed average of all provided sub-ratings (DB trigger) */
  overall_rating: number;
  /** Optional short title for the review */
  title: string | null;
  /** Optional detailed review body */
  body: string | null;
  /** True when the booking was confirmed by the platform */
  is_verified: boolean;
  /** True when an admin has approved the review for display */
  is_published: boolean;
  /** Photos attached to the review */
  images: ReviewImage[];
  /** ISO timestamp of submission */
  created_at: string;
  /** Denormalised reviewer info */
  user: {
    display_name: string;
    avatar_url: string | null;
  };
}

/**
 * Aggregated rating breakdown for a package's review summary card.
 */
export interface RatingSummary {
  overall: number;
  review_count: number;
  guide: number;
  hotel: number;
  food: number;
  transport: number;
  value: number;
}

/**
 * Input payload for POST /api/v1/reviews
 */
export interface CreateReviewInput {
  booking_id: string;
  package_id: string;
  rating_guide?: number;
  rating_hotel?: number;
  rating_food?: number;
  rating_transport?: number;
  rating_value?: number;
  title?: string;
  body?: string;
  images?: ReviewImage[];
}

/**
 * Response from GET /api/v1/reviews/eligible/:packageId
 */
export interface ReviewEligibility {
  can_review: boolean;
  booking_id?: string;
}

// ============================================================
// CLOUDINARY TYPES
// ============================================================

/**
 * Result returned after a successful Cloudinary upload.
 */
export interface CloudinaryUploadResult {
  /** Cloudinary public_id for the uploaded asset */
  public_id: string;
  /** Secure HTTPS delivery URL */
  secure_url: string;
  /** Original filename */
  original_filename: string;
  /** File format (jpg, png, etc.) */
  format: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** File size in bytes */
  bytes: number;
}

// ============================================================
// ENQUIRY TYPES
// ============================================================

/**
 * A single message within an enquiry thread.
 */
export interface EnquiryMessage {
  id: string;
  sender_role: 'user' | 'vendor';
  message: string;
  created_at: string;
}

/**
 * Enquiry thread summary, as returned in list views.
 */
export interface EnquirySummary {
  id: string;
  package: { id: string; title: string } | null;
  company: { id: string; name: string };
  subject: string;
  status: 'open' | 'closed';
  last_message_preview: string | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
}

/**
 * Full enquiry thread including all messages, oldest first.
 */
export interface EnquiryDetail extends EnquirySummary {
  messages: EnquiryMessage[];
}
