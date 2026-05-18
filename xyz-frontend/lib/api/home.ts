/**
 * @file lib/api/home.ts
 * @description Backend API calls for the home screen data.
 *
 * All functions return BackendApiResponse<T> — never throw.
 * Hooks in hooks/useHomeData.ts consume these functions.
 */

import { apiClient } from './client';
import type { BackendApiResponse, Category, Location, PackageListItem } from '../../types';

/**
 * Fetches locations from GET /locations
 * Pass popular=true to get only popular destinations.
 */
export async function getLocations(
  popular?: boolean
): Promise<BackendApiResponse<Location[]>> {
  return apiClient.get<Location[]>(
    '/locations',
    popular !== undefined ? { popular } : undefined
  );
}

/**
 * Fetches all active categories from GET /categories
 */
export async function getCategories(): Promise<BackendApiResponse<Category[]>> {
  return apiClient.get<Category[]>('/categories');
}

/**
 * Fetches featured packages from GET /packages/featured
 */
export async function getFeaturedPackagesFromBackend(): Promise<
  BackendApiResponse<PackageListItem[]>
> {
  return apiClient.get<PackageListItem[]>('/packages/featured');
}
