/**
 * @file hooks/useHomeData.ts
 * @description TanStack Query hooks for the XYZ home screen.
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '../lib/api/client';
import { Config } from '../constants/config';
import type { Category, Location, PackageListItem } from '../types';

export const homeQueryKeys = {
  locations: (popular?: boolean) => ['locations', { popular }] as const,
  categories: ['categories'] as const,
  featuredPackages: ['packages', 'featured'] as const,
} as const;

function assertData<T>(data: T | null, error: string | null): T {
  if (error) {
    throw new Error(error);
  }

  if (data === null) {
    throw new Error('The server returned an empty response.');
  }

  return data;
}

export function useLocations(
  popular?: boolean
): UseQueryResult<Location[], Error> {
  return useQuery({
    queryKey: homeQueryKeys.locations(popular),
    queryFn: async () => {
      const response = await apiClient.get<Location[]>(
        '/locations',
        popular === undefined ? undefined : { popular },
        false
      );

      return assertData(response.data, response.error);
    },
    staleTime: 10 * 60 * 1000, // 10 min — locations rarely change
    gcTime: Config.queryCacheTimeMs,
  });
}

export function useCategories(): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: homeQueryKeys.categories,
    queryFn: async () => {
      const response = await apiClient.get<Category[]>('/categories');
      return assertData(response.data, response.error);
    },
    staleTime: 10 * 60 * 1000, // 10 min — categories rarely change
    gcTime: Config.queryCacheTimeMs,
  });
}

export function useFeaturedPackages(): UseQueryResult<
  PackageListItem[],
  Error
> {
  return useQuery({
    queryKey: homeQueryKeys.featuredPackages,
    queryFn: async () => {
      const response =
        await apiClient.get<PackageListItem[]>('/packages/featured');

      return assertData(response.data, response.error);
    },
    staleTime: 5 * 60 * 1000, // 5 min — featured packages
    gcTime: Config.queryCacheTimeMs,
  });
}
