import { apiFetch } from './client';
import type { Product } from '@/types';

export interface ProductListParams {
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'bestselling';
  page?: number;
  pageSize?: number;
}

export interface ProductFacets {
  brands: string[];
  colors: string[];
  minPrice: number;
  maxPrice: number;
}

export function getProductFacets(category?: string) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch<ProductFacets>(`/products/facets${qs}`);
}

export function listProducts(params: ProductListParams = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const query = qs.toString();
  return apiFetch<{ items: Product[]; total: number; page: number; pageSize: number }>(
    `/products${query ? `?${query}` : ''}`,
  );
}

export function getProduct(idOrSlug: string) {
  return apiFetch<Product>(`/products/${idOrSlug}`);
}

export function getSimilarProducts(id: string) {
  return apiFetch<{ products: Product[] }>(`/products/${id}/similar`);
}

export function getFrequentlyBoughtTogether(id: string) {
  return apiFetch<{ products: Product[] }>(`/products/${id}/frequently-bought-together`);
}

export function searchProducts(q: string) {
  return apiFetch<Product[]>(`/search?q=${encodeURIComponent(q)}`);
}

export function addReview(productId: string, rating: number, comment?: string) {
  return apiFetch(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });
}
