/**
 * @file hooks/admin/useAdminLocations.ts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import {
  getAdminLocations,
  createAdminLocation,
  updateAdminLocation,
  deleteAdminLocation,
} from '../../lib/api/admin';
import type { Location, PaginatedResponse } from '../../types';

export const adminLocationQueryKeys = {
  all: ['admin', 'locations'] as const,
  list: (params: { page?: number; limit?: number; search?: string }) =>
    ['admin', 'locations', 'list', params] as const,
} as const;

export function useAdminLocations(
  params: { page?: number; limit?: number; search?: string } = {},
): UseQueryResult<PaginatedResponse<Location>, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminLocationQueryKeys.list(params),
    queryFn: async () => {
      const res = await getAdminLocations(params);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load locations');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}

type CreateLocationInput = { city: string; state: string; region: string; country?: string; latitude?: number | null; longitude?: number | null; is_popular?: boolean; is_active?: boolean };

export function useCreateLocation(): UseMutationResult<Location, Error, CreateLocationInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const res = await createAdminLocation(input);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to create location');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminLocationQueryKeys.all }),
  });
}

export function useUpdateLocation(): UseMutationResult<Location, Error, { id: string } & Partial<CreateLocationInput>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }) => {
      const res = await updateAdminLocation(id, input);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to update location');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminLocationQueryKeys.all }),
  });
}

export function useDeleteLocation(): UseMutationResult<{ deleted: boolean }, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await deleteAdminLocation(id);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to delete location');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminLocationQueryKeys.all }),
  });
}
