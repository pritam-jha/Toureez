/**
 * @file hooks/useVendorAnalytics.ts
 * @description Fetches vendor analytics data for charts and KPI tiles.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { VENDOR_ROLE } from '../types';
import { Config } from '../constants/config';

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

export interface VendorAnalytics {
  monthly_revenue: MonthlyRevenue[];
  top_packages: {
    id: string;
    title: string;
    total_bookings: number;
    total_revenue: number;
    avg_rating: number;
  }[];
  cancellation_rate: number;
  completion_rate: number;
  this_month_vs_last: {
    revenue_change_pct: number;
    bookings_change_pct: number;
  };
}

interface ApiResponse<T> { data: T | null; error: string | null }

export function useVendorAnalytics(): UseQueryResult<VendorAnalytics, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: ['vendor', 'analytics'],
    queryFn: async () => {
      const res = await apiClient.get<VendorAnalytics>('/vendor/analytics') as ApiResponse<VendorAnalytics>;
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load analytics.');
      return res.data;
    },
    enabled: isVendor,
    staleTime: 5 * 60_000,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}
