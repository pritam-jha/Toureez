/**
 * @file hooks/admin/useAdminVendors.ts
 * @description TanStack Query hooks for admin vendor management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import {
  getAdminVendors,
  getAdminVendor,
  approveAdminVendor,
  rejectAdminVendor,
  verifyAdminVendor,
} from '../../lib/api/admin';
import type { AdminVendor, AdminVendorListParams } from '../../types/admin';
import type { PaginatedResponse } from '../../types';

// ── Query keys ────────────────────────────────────────────────────────────────

export const adminVendorQueryKeys = {
  all: ['admin', 'vendors'] as const,
  list: (params: AdminVendorListParams) => ['admin', 'vendors', 'list', params] as const,
  detail: (id: string) => ['admin', 'vendors', 'detail', id] as const,
} as const;

// ── Queries ───────────────────────────────────────────────────────────────────

export function useAdminVendors(
  params: AdminVendorListParams = {},
): UseQueryResult<PaginatedResponse<AdminVendor>, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return useQuery({
    queryKey: adminVendorQueryKeys.list(params),
    queryFn: async () => {
      const res = await getAdminVendors(params);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load vendors');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

export function useAdminVendor(vendorId: string): UseQueryResult<AdminVendor, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return useQuery({
    queryKey: adminVendorQueryKeys.detail(vendorId),
    queryFn: async () => {
      const res = await getAdminVendor(vendorId);
      if (res.error || !res.data) throw new Error(res.error ?? 'Vendor not found');
      return res.data;
    },
    enabled: isAdmin && vendorId.length > 0,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: (count, err) => !err.message.includes('not found') && count < 2,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useApproveVendor(): UseMutationResult<AdminVendor, Error, { vendorId: string; note?: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vendorId, note }) => {
      const res = await approveAdminVendor(vendorId, note);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to approve vendor');
      return res.data;
    },
    onSuccess: (_vendor, { vendorId }) => {
      // Invalidate the specific detail key (uses URL vendorId, not response id,
      // so the cache key always matches the query running on the screen).
      void queryClient.invalidateQueries({
        queryKey: adminVendorQueryKeys.detail(vendorId),
      });
      // Invalidate the list so status badge updates on back-navigation.
      void queryClient.invalidateQueries({ queryKey: adminVendorQueryKeys.all });
    },
  });
}

export function useRejectVendor(): UseMutationResult<AdminVendor, Error, { vendorId: string; reason: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vendorId, reason }) => {
      const res = await rejectAdminVendor(vendorId, reason);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to reject vendor');
      return res.data;
    },
    onSuccess: (_vendor, { vendorId }) => {
      void queryClient.invalidateQueries({
        queryKey: adminVendorQueryKeys.detail(vendorId),
      });
      void queryClient.invalidateQueries({ queryKey: adminVendorQueryKeys.all });
    },
  });
}

export function useVerifyVendor(): UseMutationResult<AdminVendor, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vendorId) => {
      const res = await verifyAdminVendor(vendorId);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to verify vendor');
      return res.data;
    },
    onSuccess: (_vendor, vendorId) => {
      void queryClient.invalidateQueries({
        queryKey: adminVendorQueryKeys.detail(vendorId),
      });
      void queryClient.invalidateQueries({ queryKey: adminVendorQueryKeys.all });
    },
  });
}
