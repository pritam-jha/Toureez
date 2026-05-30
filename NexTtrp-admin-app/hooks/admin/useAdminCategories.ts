/**
 * @file hooks/admin/useAdminCategories.ts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../../lib/api/admin';
import type { Category } from '../../types';

export const adminCategoryQueryKeys = {
  all: ['admin', 'categories'] as const,
} as const;

export function useAdminCategories(): UseQueryResult<Category[], Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminCategoryQueryKeys.all,
    queryFn: async () => {
      const res = await getAdminCategories();
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load categories');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}

type CreateCategoryInput = { name: string; label: string; icon: string; description?: string; is_active?: boolean; display_order?: number };

export function useCreateCategory(): UseMutationResult<Category, Error, CreateCategoryInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const res = await createAdminCategory(input);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to create category');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminCategoryQueryKeys.all }),
  });
}

export function useUpdateCategory(): UseMutationResult<Category, Error, { id: string } & Partial<CreateCategoryInput>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }) => {
      const res = await updateAdminCategory(id, input);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to update category');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminCategoryQueryKeys.all }),
  });
}

export function useDeleteCategory(): UseMutationResult<{ deleted: boolean }, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await deleteAdminCategory(id);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to delete category');
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminCategoryQueryKeys.all }),
  });
}
