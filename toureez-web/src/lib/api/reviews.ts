import { apiClient, unwrapItems } from './client';

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  package_id: string;
  rating_guide: number | null;
  rating_hotel: number | null;
  rating_food: number | null;
  rating_transport: number | null;
  rating_value: number | null;
  overall_rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  is_published: boolean;
  images: { id: string; url: string }[];
  created_at: string;
  user: { display_name: string; avatar_url: string | null };
  package?: { title: string };
}

export interface SubmitReviewPayload {
  booking_id: string;
  package_id: string;
  title?: string;
  body?: string;
  rating_guide?: number;
  rating_hotel?: number;
  rating_food?: number;
  rating_transport?: number;
  rating_value?: number;
}

export async function submitReview(payload: SubmitReviewPayload) {
  return apiClient.post<Review>('/reviews', payload);
}

export async function getPackageReviews(packageId: string) {
  return unwrapItems<Review>(apiClient.get(`/reviews/package/${packageId}`));
}

export async function getReviewEligibility(packageId: string) {
  return apiClient.get<{ eligible: boolean; booking_id?: string }>(`/reviews/eligible/${packageId}`, undefined, true);
}
