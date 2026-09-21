import { apiFetch } from './client';
import type { Order } from '@/types';

export function checkout(data: { addressId?: string; paymentMethod: string }) {
  return apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) });
}

export interface OrderListResult {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export function listOrders(params: { status?: Order['status']; page?: number; pageSize?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<OrderListResult>(`/orders${suffix}`);
}

export function getOrder(id: string) {
  return apiFetch<Order>(`/orders/${id}`);
}

export function cancelOrder(id: string, reason: string) {
  return apiFetch<Order>(`/orders/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) });
}
