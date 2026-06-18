/**
 * @file hooks/admin/useAdminAnalytics.ts
 * @description Fetches admin analytics for the charts dashboard.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/config';

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

export interface AdminAnalytics {
  monthly_revenue: MonthlyRevenue[];
  user_growth: { month: string; new_users: number }[];
  top_categories: { name: string; label: string; booking_count: number }[];
  vendor_stats: { approved: number; pending: number; rejected: number };
  booking_funnel: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

export function useAdminAnalytics(): UseQueryResult<AdminAnalytics, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const res = await apiClient.get<AdminAnalytics>('/admin/analytics');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load analytics.');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: 5 * 60_000,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}
