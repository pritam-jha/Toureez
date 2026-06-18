/**
 * @file hooks/useVendorCompany.ts
 * @description Handles vendor company profile queries and mutations.
 *
 * Provides:
 *  - useVendorCompany()     — fetches company profile (null if not yet created)
 *  - useCreateCompany()     — onboarding mutation: creates the company
 *  - useUpdateCompany()     — updates company name/about/logo/etc.
 *  - useSaveCompanyDocument() — saves a Cloudinary-uploaded document record
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getCompany,
  createCompany,
  updateCompany,
  saveCompanyDocument,
} from '../lib/api/vendor';
import { useAuthStore } from '../store/authStore';
import { VENDOR_ROLE, type VendorCompany, type CompanyDocument } from '../types';
import { Config } from '../constants/config';
import { vendorDashboardQueryKeys } from './useVendorDashboard';

// ── Query keys ────────────────────────────────────────────────────────────────

export const vendorCompanyQueryKeys = {
  all: ['vendor', 'company'] as const,
  detail: () => ['vendor', 'company', 'detail'] as const,
} as const;

// ── Company query ─────────────────────────────────────────────────────────────

/**
 * Fetches the vendor's company profile.
 * Returns data = null if the vendor has not yet completed onboarding.
 */
export function useVendorCompany(): UseQueryResult<VendorCompany | null, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorCompanyQueryKeys.detail(),
    queryFn: async () => {
      const { data, error } = await getCompany();
      if (error !== null) throw new Error(error);
      return data ?? null;
    },
    enabled: isVendor,
    staleTime: 0,              // always refetch — status can change via admin approval
    gcTime: Config.queryCacheTimeMs,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

// ── Create company mutation ───────────────────────────────────────────────────

interface CreateCompanyVars {
  name: string;
  about?: string;
  gst_number?: string;
  logo_url?: string;
  cover_url?: string;
}

/**
 * Mutation to create the vendor's company profile during onboarding.
 * Invalidates company + dashboard queries on success.
 */
export function useCreateCompany(): UseMutationResult<VendorCompany, Error, CreateCompanyVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars) => {
      const { data, error } = await createCompany(vars);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to create company');
      return data;
    },
    onSuccess: (company) => {
      // Seed cache with the new company to avoid a round-trip
      queryClient.setQueryData(vendorCompanyQueryKeys.detail(), company);
      void queryClient.invalidateQueries({ queryKey: vendorDashboardQueryKeys.all });
    },
  });
}

// ── Update company mutation ───────────────────────────────────────────────────

interface UpdateCompanyVars {
  name?: string;
  about?: string;
  gst_number?: string;
  logo_url?: string;
  cover_url?: string;
}

/**
 * Mutation to update the vendor's existing company profile.
 * Applies an optimistic update for a snappy UI experience.
 */
export function useUpdateCompany(): UseMutationResult<VendorCompany, Error, UpdateCompanyVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars) => {
      const { data, error } = await updateCompany(vars);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to update company');
      return data;
    },
    onMutate: async (vars) => {
      // Cancel any in-flight queries for company detail
      await queryClient.cancelQueries({ queryKey: vendorCompanyQueryKeys.detail() });

      // Snapshot previous value for rollback
      const snapshot = queryClient.getQueryData<VendorCompany | null>(vendorCompanyQueryKeys.detail());

      // Optimistically merge the incoming fields
      if (snapshot != null) {
        queryClient.setQueryData(vendorCompanyQueryKeys.detail(), { ...snapshot, ...vars });
      }

      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(vendorCompanyQueryKeys.detail(), context.snapshot);
      }
    },
    onSuccess: (company) => {
      queryClient.setQueryData(vendorCompanyQueryKeys.detail(), company);
    },
  });
}

// ── Save document mutation ────────────────────────────────────────────────────

interface SaveDocumentVars {
  document_type: 'trade_license' | 'gst_certificate' | 'pan_card' | 'other';
  url: string;
  public_id: string;
  label?: string;
}

/**
 * Mutation to save a company document after Cloudinary upload.
 */
export function useSaveCompanyDocument(): UseMutationResult<CompanyDocument, Error, SaveDocumentVars> {
  return useMutation({
    mutationFn: async (vars) => {
      const { data, error } = await saveCompanyDocument(vars);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to save document');
      return data;
    },
  });
}
