/**
 * @file hooks/admin/useAdminUsers.ts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { getAdminUsers, getAdminUser, updateAdminUserRole } from '../../lib/api/admin';
import type { AdminUser, AdminListParams } from '../../types/admin';
import type { PaginatedResponse, UserRole } from '../../types';

export const adminUserQueryKeys = {
  all: ['admin', 'users'] as const,
  list: (params: AdminListParams & { role?: string }) => ['admin', 'users', 'list', params] as const,
  detail: (id: string) => ['admin', 'users', 'detail', id] as const,
} as const;

export function useAdminUsers(
  params: AdminListParams & { role?: string } = {},
): UseQueryResult<PaginatedResponse<AdminUser>, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminUserQueryKeys.list(params),
    queryFn: async () => {
      const res = await getAdminUsers(params);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load users');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

export function useAdminUser(
  userId: string,
): UseQueryResult<AdminUser & { email: string; booking_count: number }, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminUserQueryKeys.detail(userId),
    queryFn: async () => {
      const res = await getAdminUser(userId);
      if (res.error || !res.data) throw new Error(res.error ?? 'User not found');
      return res.data;
    },
    enabled: isAdmin && userId.length > 0,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: (count, err) => !err.message.includes('not found') && count < 2,
  });
}

export function useUpdateUserRole(): UseMutationResult<AdminUser, Error, { userId: string; role: UserRole }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }) => {
      const res = await updateAdminUserRole(userId, role);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to update role');
      return res.data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(adminUserQueryKeys.detail(user.id), user);
      void queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.all });
    },
  });
}
