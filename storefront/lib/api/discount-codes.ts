import { apiFetch } from './client';

export function validateDiscountCode(code: string, subtotal: number) {
  return apiFetch<{ discountCode: string; discountAmount: number }>('/discount-codes/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}
