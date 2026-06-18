/**
 * @file hooks/useVendorEnquiries.ts
 * @description TanStack Query hooks for the vendor's enquiry inbox.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  getEnquiry,
  listEnquiries,
  sendEnquiryMessage,
  setEnquiryStatus,
} from '../lib/api/vendor';
import { useAuthStore } from '../store/authStore';
import { Config } from '../constants/config';
import { VENDOR_ROLE } from '../types';
import type { EnquiryDetail, EnquirySummary } from '../types';

export const vendorEnquiryQueryKeys = {
  all: ['vendor', 'enquiries'] as const,
  list: () => ['vendor', 'enquiries', 'list'] as const,
  detail: (id: string) => ['vendor', 'enquiries', 'detail', id] as const,
} as const;

/**
 * Returns the enquiry threads started by travelers about the vendor's company.
 */
export function useVendorEnquiries(): UseQueryResult<EnquirySummary[], Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorEnquiryQueryKeys.list(),
    queryFn: async () => {
      const { data, error } = await listEnquiries();
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load enquiries');
      return data;
    },
    enabled: isVendor,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

/**
 * Returns a single enquiry thread with its full message history.
 */
export function useVendorEnquiryDetail(enquiryId: string): UseQueryResult<EnquiryDetail, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorEnquiryQueryKeys.detail(enquiryId),
    queryFn: async () => {
      const { data, error } = await getEnquiry(enquiryId);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load enquiry');
      return data;
    },
    enabled: isVendor && enquiryId.trim().length > 0,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

/**
 * Returns the total number of enquiry messages awaiting a vendor reply.
 */
export function useUnreadEnquiryCount(): number {
  const enquiriesQuery = useVendorEnquiries();
  return (enquiriesQuery.data ?? []).reduce((total, enquiry) => total + enquiry.unread_count, 0);
}

interface SendMessageInput {
  enquiryId: string;
  message: string;
}

/**
 * Posts a reply to an enquiry thread.
 */
export function useSendEnquiryReply(): UseMutationResult<EnquiryDetail, Error, SendMessageInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enquiryId, message }: SendMessageInput) => {
      const { data, error } = await sendEnquiryMessage(enquiryId, message);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to send message');
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(vendorEnquiryQueryKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: vendorEnquiryQueryKeys.list() });
    },
  });
}

interface SetStatusInput {
  enquiryId: string;
  status: 'open' | 'closed';
}

/**
 * Marks an enquiry thread as open or closed.
 */
export function useSetEnquiryStatus(): UseMutationResult<EnquiryDetail, Error, SetStatusInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enquiryId, status }: SetStatusInput) => {
      const { data, error } = await setEnquiryStatus(enquiryId, status);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to update enquiry');
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(vendorEnquiryQueryKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: vendorEnquiryQueryKeys.list() });
    },
  });
}
