/**
 * @file hooks/admin/useAdminPayouts.ts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { getAdminPayouts, updateAdminPayoutStatus } from '../../lib/api/admin';
import type { AdminPayout, AdminPayoutListParams, PayoutStatus } from '../../types/admin';
import type { PaginatedResponse } from '../../types';

export const adminPayoutQueryKeys = {
  all: ['admin', 'payouts'] as const,
  list: (params: AdminPayoutListParams) => ['admin', 'payouts', 'list', params] as const,
} as const;

export function useAdminPayouts(
  params: AdminPayoutListParams = {},
): UseQueryResult<PaginatedResponse<AdminPayout>, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminPayoutQueryKeys.list(params),
    queryFn: async () => {
      const res = await getAdminPayouts(params);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load payouts');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

export function useUpdatePayoutStatus(): UseMutationResult<
  AdminPayout,
  Error,
  { payoutId: string; status: PayoutStatus; note?: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payoutId, status, note: _note }) => {
      const res = await updateAdminPayoutStatus(payoutId, status);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to update payout');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminPayoutQueryKeys.all }),
  });
}
