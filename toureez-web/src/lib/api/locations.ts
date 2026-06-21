import { apiClient } from './client';

export interface Location {
  id: string;
  city: string;
  state?: string;
  region?: string;
  image_url?: string;
  is_popular?: boolean;
  [key: string]: unknown;
}

export async function getLocations(popularOnly = false) {
  return apiClient.get<Location[]>('/locations', { popular: popularOnly || undefined });
}
