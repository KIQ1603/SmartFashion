import { apiFetch } from './client';
import type { Cart } from '@/types';

export function getCart() {
  return apiFetch<Cart>('/cart');
}

export function addCartItem(variantId: string, quantity = 1) {
  return apiFetch<Cart>('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
}

export function updateCartItem(itemId: string, quantity: number) {
  return apiFetch<Cart>(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
}

export function removeCartItem(itemId: string) {
  return apiFetch<Cart>(`/cart/items/${itemId}`, { method: 'DELETE' });
}
