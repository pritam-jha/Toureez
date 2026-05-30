/**
 * @file hooks/useVendorPayouts.ts
 * @description Fetches payout disbursement history and payout accounts.
 *
 * Provides:
 *  - useVendorPayouts()         — paginated payout history
 *  - useVendorPayoutAccounts()  — list of bank/UPI accounts
 *  - useCreatePayoutAccount()   — add a new payout account
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { listPayouts, listPayoutAccounts, createPayoutAccount } from '../lib/api/vendor';
import { useAuthStore } from '../store/authStore';
import { VENDOR_ROLE } from '../types';
import type { VendorPayout, VendorPayoutAccount, PaginatedResponse } from '../types';
import { Config } from '../constants/config';

export const vendorPayoutQueryKeys = {
  all: ['vendor', 'payouts'] as const,
  list: (page: number) => ['vendor', 'payouts', 'list', page] as const,
  accounts: () => ['vendor', 'payout-accounts'] as const,
} as const;

/**
 * Returns paginated payout disbursement history.
 */
export function useVendorPayouts(page = 1): UseQueryResult<PaginatedResponse<VendorPayout>, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorPayoutQueryKeys.list(page),
    queryFn: async () => {
      const { data, error } = await listPayouts({ page, limit: 20 });
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load payouts');
      return data;
    },
    enabled: isVendor,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

/**
 * Returns all payout bank/UPI accounts for the vendor's company.
 */
export function useVendorPayoutAccounts(): UseQueryResult<VendorPayoutAccount[], Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorPayoutQueryKeys.accounts(),
    queryFn: async () => {
      const { data, error } = await listPayoutAccounts();
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load payout accounts');
      return data;
    },
    enabled: isVendor,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

// ── Create payout account ─────────────────────────────────────────────────────

interface CreateAccountVars {
  account_holder_name: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  is_primary?: boolean;
}

/**
 * Mutation to add a new payout account.
 */
export function useCreatePayoutAccount(): UseMutationResult<VendorPayoutAccount, Error, CreateAccountVars> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars) => {
      const { data, error } = await createPayoutAccount(vars);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to create payout account');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorPayoutQueryKeys.accounts() });
    },
  });
}
