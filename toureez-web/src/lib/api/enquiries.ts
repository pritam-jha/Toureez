import { apiClient } from './client';

export interface Enquiry {
  id: string;
  package: { id: string; title: string } | null;
  company: { id: string; name: string };
  subject: string;
  status: 'open' | 'closed';
  last_message_preview: string | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  messages?: EnquiryMessage[];
}

export interface EnquiryMessage {
  id: string;
  sender_role: 'user' | 'vendor';
  message: string;
  created_at: string;
}

/** Backend nests the package under `enquiry.package`. */
export function enquiryPackageTitle(enquiry: Enquiry): string {
  return enquiry.package?.title ?? enquiry.package?.id ?? '';
}

export async function createEnquiry(packageId: string, message: string) {
  return apiClient.post<Enquiry>('/enquiries', { package_id: packageId, message });
}

export async function listEnquiries() {
  return apiClient.get<Enquiry[]>('/enquiries', undefined, true);
}

export async function getEnquiryDetail(id: string) {
  return apiClient.get<Enquiry>(`/enquiries/${id}`, undefined, true);
}

export async function postEnquiryMessage(id: string, message: string) {
  return apiClient.post<EnquiryMessage>(`/enquiries/${id}/messages`, { message });
}
