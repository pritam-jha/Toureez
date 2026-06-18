/**
 * @file hooks/admin/useAdminPackages.ts
 * @description TanStack Query hooks for admin package moderation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import {
  getAdminPackages,
  getAdminPackage,
  approveAdminPackage,
  rejectAdminPackage,
  featureAdminPackage,
  setBestsellerAdminPackage,
  deleteAdminPackage,
} from '../../lib/api/admin';
import { adminDashboardQueryKeys } from './useAdminDashboard';
import type { AdminPackageListItem, AdminPackageListParams } from '../../types/admin';
import type { PaginatedResponse } from '../../types';

export const adminPackageQueryKeys = {
  all: ['admin', 'packages'] as const,
  list: (params: AdminPackageListParams) => ['admin', 'packages', 'list', params] as const,
  detail: (id: string) => ['admin', 'packages', 'detail', id] as const,
} as const;

export function useAdminPackages(
  params: AdminPackageListParams = {},
): UseQueryResult<PaginatedResponse<AdminPackageListItem>, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return useQuery({
    queryKey: adminPackageQueryKeys.list(params),
    queryFn: async () => {
      const res = await getAdminPackages(params);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load packages');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

export function useAdminPackage(packageId: string): UseQueryResult<AdminPackageListItem, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return useQuery({
    queryKey: adminPackageQueryKeys.detail(packageId),
    queryFn: async () => {
      const res = await getAdminPackage(packageId);
      if (res.error || !res.data) throw new Error(res.error ?? 'Package not found');
      return res.data;
    },
    enabled: isAdmin && packageId.length > 0,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: (count, err) => !err.message.includes('not found') && count < 2,
  });
}

export function useApprovePackage(): UseMutationResult<AdminPackageListItem, Error, { packageId: string; note?: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ packageId, note }) => {
      const res = await approveAdminPackage(packageId, note);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to approve package');
      return res.data;
    },
    onSuccess: (_pkg, { packageId }) => {
      void queryClient.invalidateQueries({ queryKey: adminPackageQueryKeys.detail(packageId) });
      void queryClient.invalidateQueries({ queryKey: adminPackageQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKeys.all });
    },
  });
}

export function useRejectPackage(): UseMutationResult<AdminPackageListItem, Error, { packageId: string; reason: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ packageId, reason }) => {
      const res = await rejectAdminPackage(packageId, reason);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to reject package');
      return res.data;
    },
    onSuccess: (_pkg, { packageId }) => {
      void queryClient.invalidateQueries({ queryKey: adminPackageQueryKeys.detail(packageId) });
      void queryClient.invalidateQueries({ queryKey: adminPackageQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKeys.all });
    },
  });
}

export function useFeaturePackage(): UseMutationResult<
  AdminPackageListItem,
  Error,
  { packageId: string; isFeatured: boolean; isBestseller?: boolean },
  { previous?: AdminPackageListItem }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ packageId, isFeatured, isBestseller }) => {
      const res = await featureAdminPackage(packageId, isFeatured, isBestseller);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to update package');
      return res.data;
    },
    // The Switch's `value` is bound to the cached package, so without an
    // optimistic update it snaps back to its old position the instant the
    // toggle re-renders (before the request resolves) — making the first
    // tap appear to do nothing and a second tap required to "stick".
    onMutate: async ({ packageId, isFeatured, isBestseller }) => {
      const queryKey = adminPackageQueryKeys.detail(packageId);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<AdminPackageListItem>(queryKey);
      if (previous) {
        queryClient.setQueryData<AdminPackageListItem>(queryKey, {
          ...previous,
          is_featured: isFeatured,
          is_bestseller: isBestseller ?? previous.is_bestseller,
        });
      }
      return { previous };
    },
    onError: (_err, { packageId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(adminPackageQueryKeys.detail(packageId), context.previous);
      }
    },
    onSettled: (_pkg, _err, { packageId }) => {
      void queryClient.invalidateQueries({
        queryKey: adminPackageQueryKeys.detail(packageId),
      });
      void queryClient.invalidateQueries({ queryKey: adminPackageQueryKeys.all });
    },
  });
}

export function useDeletePackage(): UseMutationResult<{ deleted: boolean }, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (packageId: string) => {
      const res = await deleteAdminPackage(packageId);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to delete package');
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminPackageQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKeys.all });
    },
  });
}
