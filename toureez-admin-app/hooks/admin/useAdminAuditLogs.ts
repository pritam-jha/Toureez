/**
 * @file hooks/admin/useAdminAuditLogs.ts
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { getAdminAuditLogs } from '../../lib/api/admin';
import type { AdminAuditLog, AdminAuditLogListParams } from '../../types/admin';
import type { PaginatedResponse } from '../../types';

export const adminAuditLogQueryKeys = {
  all: ['admin', 'audit-logs'] as const,
  list: (params: AdminAuditLogListParams) => ['admin', 'audit-logs', 'list', params] as const,
} as const;

/**
 * Read-only audit log query. Stale after 1 minute (audit logs are append-only
 * and written on every admin mutation, so they change frequently).
 */
export function useAdminAuditLogs(
  params: AdminAuditLogListParams = {},
): UseQueryResult<PaginatedResponse<AdminAuditLog>, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminAuditLogQueryKeys.list(params),
    queryFn: async () => {
      const res = await getAdminAuditLogs(params);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load audit logs');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: 60 * 1000,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}
