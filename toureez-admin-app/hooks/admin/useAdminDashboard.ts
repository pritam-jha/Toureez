/**
 * @file hooks/admin/useAdminDashboard.ts
 * @description TanStack Query hook for the admin dashboard metrics endpoint.
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { getAdminDashboard, getAdminEarningsForMonth, type AdminMonthlyEarnings } from '../../lib/api/admin';
import type { AdminDashboardMetrics } from '../../types/admin';

export const adminDashboardQueryKeys = {
  all: ['admin', 'dashboard'] as const,
  earnings: (month: string) => ['admin', 'earnings', month] as const,
} as const;

/**
 * Fetches platform-wide metrics for the admin dashboard.
 * Stale after 2 minutes — dashboard data changes frequently.
 */
export function useAdminDashboard(): UseQueryResult<AdminDashboardMetrics, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return useQuery({
    queryKey: adminDashboardQueryKeys.all,
    queryFn: async () => {
      const res = await getAdminDashboard();
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load dashboard');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: 2 * 60 * 1000,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

/**
 * Fetches total paid-payment revenue for a single calendar month
 * (format: "YYYY-MM"), used by the Revenue Overview month picker.
 */
export function useAdminEarningsForMonth(month: string): UseQueryResult<AdminMonthlyEarnings, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const isValidMonth = /^\d{4}-\d{2}$/.test(month);

  return useQuery({
    queryKey: adminDashboardQueryKeys.earnings(month),
    queryFn: async () => {
      const res = await getAdminEarningsForMonth(month);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load earnings');
      return res.data;
    },
    enabled: isAdmin && isValidMonth,
    staleTime: 2 * 60 * 1000,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}
