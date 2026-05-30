/**
 * @file types/index.ts
 * Shared domain types used across hooks, API layer, and screens.
 */
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'traveler' | 'company_owner' | 'admin';
export const VENDOR_ROLE = 'company_owner' as const;

export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  role: UserRole;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (user: User | null, session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export interface BackendApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

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

export interface Review {
  id: string;
  user_id: string;
  package_id: string;
  overall_rating: number;
  title: string | null;
  body: string | null;
  is_published: boolean;
  is_verified: boolean;
  created_at: string;
  user: { display_name: string };
}

export interface Package {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  status: 'draft' | 'pending' | 'active' | 'rejected';
  is_featured: boolean;
  is_bestseller: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
}
