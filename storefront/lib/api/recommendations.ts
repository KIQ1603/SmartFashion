import { apiFetch } from './client';
import type { Product } from '@/types';

export function getHomepageRecommendations() {
  return apiFetch<{ algorithm: string; products: Product[] }>('/recommendations/homepage');
}

export function getTrending(categoryId?: string) {
  const qs = categoryId ? `?category_id=${categoryId}` : '';
  return apiFetch<{ products: Product[] }>(`/recommendations/trending${qs}`);
}
