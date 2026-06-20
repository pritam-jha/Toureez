import { apiClient } from './client';
import type { PackageSummary } from './packages';

export async function getWishlist() {
  return apiClient.get<PackageSummary[]>('/wishlist', undefined, true);
}

export async function addToWishlist(packageId: string) {
  return apiClient.post<{ added: boolean }>('/wishlist', { package_id: packageId });
}

export async function toggleWishlist(packageId: string) {
  return apiClient.post<{ wishlisted: boolean }>('/wishlist/toggle', { package_id: packageId });
}

export async function removeFromWishlist(packageId: string) {
  return apiClient.delete<{ removed: boolean }>(`/wishlist/${packageId}`);
}
