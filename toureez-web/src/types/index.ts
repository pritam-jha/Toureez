export type UserRole = 'traveler' | 'company_owner' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  avatarUrl?: string | null;
}

export interface BackendApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}
