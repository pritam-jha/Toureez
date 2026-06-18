/**
 * @file hooks/admin/useSystemHealth.ts
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getSystemHealth } from '../../lib/api/admin';
import type { SystemHealth } from '../../types/admin';

export const systemHealthQueryKeys = {
  all: ['admin', 'system-health'] as const,
} as const;

export interface SystemHealthResult extends SystemHealth {
  /** Round-trip time for the health check request, in milliseconds. */
  latency_ms: number;
}

/**
 * Polls the backend's /health endpoint every 30 seconds to report
 * service uptime and database connectivity, plus measured request latency.
 */
export function useSystemHealth(): UseQueryResult<SystemHealthResult, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return useQuery({
    queryKey: systemHealthQueryKeys.all,
    queryFn: async () => {
      const startedAt = Date.now();
      const res = await getSystemHealth();
      const latency_ms = Date.now() - startedAt;

      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load system health');
      return { ...res.data, latency_ms };
    },
    enabled: isAdmin,
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchInterval: 30 * 1000,
    retry: 1,
  });
}
