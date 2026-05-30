/**
 * @file hooks/useVendorPackages.ts
 * @description Handles vendor package CRUD operations, query synchronization,
 * optimistic updates, and package filtering state.
 *
 * Provides:
 *  - useVendorPackages()        — paginated package list (with filters from store)
 *  - useVendorPackage(id)       — single package detail
 *  - useCreatePackage()         — draft creation mutation
 *  - useUpdatePackage()         — core fields update mutation
 *  - useSubmitPackage()         — submit for review mutation
 *  - useUpsertPricing(id)       — pricing tier replacement mutation
 *  - useUpsertItinerary(id)     — itinerary replacement mutation
 *  - useSavePackageImage(id)    — gallery image save mutation
 *  - useDeletePackageImage(id)  — gallery image delete mutation
 *  - useSetPackageCoverImage(id) — set cover image mutation
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  submitPackage,
  deletePackage,
  duplicatePackage,
  upsertPricing,
  upsertItinerary,
  savePackageImage,
  deletePackageImage,
  setPackageCoverImage,
} from '../lib/api/vendor';
import { useAuthStore } from '../store/authStore';
import { useVendorStore } from '../store/vendorStore';
import { VENDOR_ROLE } from '../types';
import type {
  VendorPackageListItem,
  VendorPackageDetail,
  VendorPricingTier,
  VendorItineraryDay,
  VendorPackageImage,
  PaginatedResponse,
} from '../types';
import { Config } from '../constants/config';
import { vendorDashboardQueryKeys } from './useVendorDashboard';

// ── Query keys ────────────────────────────────────────────────────────────────

export const vendorPackageQueryKeys = {
  all: ['vendor', 'packages'] as const,
  list: (filters: { status?: string; search?: string; page?: number }) =>
    ['vendor', 'packages', 'list', filters] as const,
  detail: (id: string) => ['vendor', 'packages', 'detail', id] as const,
} as const;

// ── Package list ──────────────────────────────────────────────────────────────

/**
 * Returns the paginated list of packages for the authenticated vendor,
 * applying any active filters from the vendorStore.
 */
export function useVendorPackages(page = 1): UseQueryResult<PaginatedResponse<VendorPackageListItem>, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);
  const filters = useVendorStore((s) => s.packageFilters);

  return useQuery({
    queryKey: vendorPackageQueryKeys.list({ ...filters, page }),
    queryFn: async () => {
      const { data, error } = await listPackages({ ...filters, page, limit: Config.packagesPageSize });
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load packages');
      return data;
    },
    enabled: isVendor,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

// ── Package detail ────────────────────────────────────────────────────────────

/**
 * Returns full package detail (pricing, itinerary, images).
 */
export function useVendorPackage(packageId: string): UseQueryResult<VendorPackageDetail, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorPackageQueryKeys.detail(packageId),
    queryFn: async () => {
      const { data, error } = await getPackage(packageId);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load package');
      return data;
    },
    enabled: isVendor && packageId !== '',
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

// ── Create package ────────────────────────────────────────────────────────────

interface CreatePackageVars {
  title: string;
  location_id: string;
  category_id: string;
  description?: string;
  highlights?: string[];
  duration_days?: number;
  duration_nights?: number;
  min_group_size?: number;
  max_group_size?: number;
  inclusions?: string[];
  exclusions?: string[];
  amenities?: string[];
}

export function useCreatePackage(): UseMutationResult<VendorPackageDetail, Error, CreatePackageVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars) => {
      const { data, error } = await createPackage(vars);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to create package');
      return data;
    },
    onSuccess: (pkg) => {
      // Seed the detail cache immediately
      queryClient.setQueryData(vendorPackageQueryKeys.detail(pkg.id), pkg);
      // Invalidate list so new draft appears
      void queryClient.invalidateQueries({ queryKey: vendorPackageQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: vendorDashboardQueryKeys.all });
    },
  });
}

// ── Update package ────────────────────────────────────────────────────────────

interface UpdatePackageVars {
  packageId: string;
  updates: {
    title?: string;
    location_id?: string;
    category_id?: string;
    description?: string;
    highlights?: string[];
    duration_days?: number;
    duration_nights?: number;
    min_group_size?: number;
    max_group_size?: number;
    inclusions?: string[];
    exclusions?: string[];
    amenities?: string[];
  };
}

export function useUpdatePackage(): UseMutationResult<VendorPackageDetail, Error, UpdatePackageVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, updates }) => {
      const { data, error } = await updatePackage(packageId, updates);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to update package');
      return data;
    },
    onSuccess: (pkg) => {
      queryClient.setQueryData(vendorPackageQueryKeys.detail(pkg.id), pkg);
      void queryClient.invalidateQueries({ queryKey: vendorPackageQueryKeys.all });
    },
  });
}

// ── Submit package ────────────────────────────────────────────────────────────

export function useSubmitPackage(): UseMutationResult<VendorPackageDetail, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId) => {
      const { data, error } = await submitPackage(packageId);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to submit package');
      return data;
    },
    onSuccess: (pkg) => {
      queryClient.setQueryData(vendorPackageQueryKeys.detail(pkg.id), pkg);
      void queryClient.invalidateQueries({ queryKey: vendorPackageQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: vendorDashboardQueryKeys.all });
    },
  });
}

// ── Delete package ────────────────────────────────────────────────────────────

/**
 * Mutation to permanently delete a draft or rejected package with no bookings.
 * Removes the detail cache entry, invalidates the list and dashboard.
 */
export function useDeletePackage(): UseMutationResult<{ deleted: boolean }, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId) => {
      const { data, error } = await deletePackage(packageId);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to delete package');
      return data;
    },
    onSuccess: (_, packageId) => {
      queryClient.removeQueries({ queryKey: vendorPackageQueryKeys.detail(packageId) });
      void queryClient.invalidateQueries({ queryKey: vendorPackageQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: vendorDashboardQueryKeys.all });
    },
  });
}

// ── Pricing ───────────────────────────────────────────────────────────────────

interface UpsertPricingVars {
  packageId: string;
  tiers: Array<{
    id?: string;
    label: string;
    min_people: number;
    max_people: number;
    base_price: number;
    discounted_price?: number | null;
    currency?: string;
    season?: 'all' | 'peak' | 'off-peak';
    valid_from?: string | null;
    valid_until?: string | null;
    is_active?: boolean;
  }>;
}

export function useUpsertPricing(packageId: string): UseMutationResult<VendorPricingTier[], Error, UpsertPricingVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId: pid, tiers }) => {
      const { data, error } = await upsertPricing(pid, tiers);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to save pricing');
      return data;
    },
    onSuccess: (pricing) => {
      // Merge updated pricing into the cached package detail
      queryClient.setQueryData<VendorPackageDetail>(
        vendorPackageQueryKeys.detail(packageId),
        (old) => (old != null ? { ...old, pricing } : undefined),
      );
    },
  });
}

// ── Itinerary ─────────────────────────────────────────────────────────────────

interface UpsertItineraryVars {
  packageId: string;
  days: Array<{
    id?: string;
    day_number: number;
    title: string;
    description?: string;
    meals?: string[];
    accommodation?: string;
    activities?: string[];
    transport?: string;
  }>;
}

export function useUpsertItinerary(packageId: string): UseMutationResult<VendorItineraryDay[], Error, UpsertItineraryVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId: pid, days }) => {
      const { data, error } = await upsertItinerary(pid, days);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to save itinerary');
      return data;
    },
    onSuccess: (itinerary) => {
      queryClient.setQueryData<VendorPackageDetail>(
        vendorPackageQueryKeys.detail(packageId),
        (old) => (old != null ? { ...old, itinerary } : undefined),
      );
    },
  });
}

// ── Images ────────────────────────────────────────────────────────────────────

interface SaveImageVars {
  packageId: string;
  url: string;
  public_id: string;
  alt_text?: string;
  is_cover?: boolean;
}

export function useSavePackageImage(): UseMutationResult<VendorPackageImage, Error, SaveImageVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, ...input }) => {
      const { data, error } = await savePackageImage(packageId, input);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to save image');
      return data;
    },
    onSuccess: (image, { packageId }) => {
      queryClient.setQueryData<VendorPackageDetail>(
        vendorPackageQueryKeys.detail(packageId),
        (old) => {
          if (old == null) return undefined;
          const images = image.is_cover
            ? [...old.images.map((img) => ({ ...img, is_cover: false })), image]
            : [...old.images, image];
          return { ...old, images };
        },
      );
    },
  });
}

interface DeleteImageVars {
  packageId: string;
  imageId: string;
}

export function useDeletePackageImage(): UseMutationResult<{ deleted: boolean }, Error, DeleteImageVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, imageId }) => {
      const { data, error } = await deletePackageImage(packageId, imageId);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to delete image');
      return data;
    },
    onSuccess: (_, { packageId, imageId }) => {
      queryClient.setQueryData<VendorPackageDetail>(
        vendorPackageQueryKeys.detail(packageId),
        (old) => {
          if (old == null) return undefined;
          const remaining = old.images.filter((img) => img.id !== imageId);
          // If the deleted image was the cover, promote the first remaining image
          const wasCover = old.images.find((img) => img.id === imageId)?.is_cover ?? false;
          const images =
            wasCover && remaining.length > 0
              ? [{ ...remaining[0], is_cover: true }, ...remaining.slice(1)]
              : remaining;
          return { ...old, images };
        },
      );
    },
  });
}

interface SetCoverImageVars {
  packageId: string;
  imageId: string;
}

export function useSetPackageCoverImage(): UseMutationResult<VendorPackageImage, Error, SetCoverImageVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, imageId }) => {
      const { data, error } = await setPackageCoverImage(packageId, imageId);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to set cover image');
      return data;
    },
    onSuccess: (image, { packageId }) => {
      queryClient.setQueryData<VendorPackageDetail>(
        vendorPackageQueryKeys.detail(packageId),
        (old) => {
          if (old == null) return undefined;
          return {
            ...old,
            images: old.images.map((img) => ({ ...img, is_cover: img.id === image.id })),
          };
        },
      );
    },
  });
}

/**
 * Duplicates an existing package as a new draft.
 * Invalidates the package list so the copy appears immediately.
 */
export function useDuplicatePackage(): UseMutationResult<VendorPackageDetail, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: string) => {
      const { data, error } = await duplicatePackage(packageId);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to duplicate package');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorPackageQueryKeys.all });
    },
  });
}
