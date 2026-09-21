import { apiFetch } from './client';
import type { Address, Product, User } from '@/types';

export function getMe() {
  return apiFetch<User>('/users/me');
}

export function updateMe(data: Partial<Pick<User, 'fullName' | 'gender' | 'birthYear'>>) {
  return apiFetch<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export function getAddresses() {
  return apiFetch<Address[]>('/users/me/addresses');
}

export function createAddress(data: { recipient: string; phone: string; line: string; city: string; province?: string; isDefault?: boolean }) {
  return apiFetch<Address>('/users/me/addresses', { method: 'POST', body: JSON.stringify(data) });
}

export function updateAddress(id: string, data: Partial<{ recipient: string; phone: string; line: string; city: string; province?: string; isDefault?: boolean }>) {
  return apiFetch<Address>(`/users/me/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function setDefaultAddress(id: string) {
  return apiFetch<Address>(`/users/me/addresses/${id}/default`, { method: 'PATCH' });
}

export function removeAddress(id: string) {
  return apiFetch(`/users/me/addresses/${id}`, { method: 'DELETE' });
}

export function getWishlist() {
  return apiFetch<Array<{ id: string; product: Product }>>('/users/me/wishlist');
}

export function addToWishlist(productId: string) {
  return apiFetch('/users/me/wishlist', { method: 'POST', body: JSON.stringify({ productId }) });
}

export function removeFromWishlist(productId: string) {
  return apiFetch(`/users/me/wishlist/${productId}`, { method: 'DELETE' });
}
