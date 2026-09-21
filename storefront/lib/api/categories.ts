import { apiFetch } from './client';
import type { Category } from '@/types';

export function getCategoryTree() {
  return apiFetch<Category[]>('/categories');
}
