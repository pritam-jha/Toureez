/**
 * @file lib/api/enquiries.ts
 * @description Backend API calls for the traveler-facing enquiry system.
 *
 * Lets a traveler message a vendor about a package without sharing
 * personal contact details — all messages are relayed through the backend.
 */

import { apiClient } from './client';
import type { ApiResponse, BackendApiResponse, EnquiryDetail, EnquirySummary } from '../../types';

function toApiResponse<T>(response: BackendApiResponse<T>): ApiResponse<T> {
  return {
    data: response.data,
    error: response.error,
  };
}

/**
 * Starts a new enquiry thread about a package.
 */
export async function createEnquiry(
  packageId: string,
  message: string
): Promise<ApiResponse<EnquiryDetail>> {
  const response = await apiClient.post<EnquiryDetail>('/enquiries', {
    package_id: packageId,
    message,
  });
  return toApiResponse(response);
}

/**
 * Fetches all enquiry threads started by the authenticated traveler.
 */
export async function getMyEnquiries(): Promise<ApiResponse<EnquirySummary[]>> {
  const response = await apiClient.get<EnquirySummary[]>('/enquiries', undefined, true);
  return toApiResponse(response);
}

/**
 * Fetches a single enquiry thread with all messages.
 */
export async function getEnquiryById(id: string): Promise<ApiResponse<EnquiryDetail>> {
  const response = await apiClient.get<EnquiryDetail>(`/enquiries/${encodeURIComponent(id)}`, undefined, true);
  return toApiResponse(response);
}

/**
 * Posts a follow-up message to an existing enquiry thread.
 */
export async function sendEnquiryMessage(id: string, message: string): Promise<ApiResponse<EnquiryDetail>> {
  const response = await apiClient.post<EnquiryDetail>(`/enquiries/${encodeURIComponent(id)}/messages`, {
    message,
  });
  return toApiResponse(response);
}
