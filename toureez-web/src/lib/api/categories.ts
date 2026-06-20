import { apiClient } from './client';

export interface Category {
  id: string;
  name: string;
  label?: string;
  description?: string;
  icon?: string;
  [key: string]: unknown;
}

export async function getCategories() {
  return apiClient.get<Category[]>('/categories');
}
