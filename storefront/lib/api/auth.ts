import { apiFetch } from './client';
import type { User } from '@/types';

export function requestRegisterOtp(email: string) {
  return apiFetch<{ success: boolean; message: string }>('/auth/register/otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function register(data: { email: string; password: string; fullName: string; otp: string }) {
  return apiFetch<{ user: User; accessToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Backend trả { google: boolean } - dùng để ẩn nút "Đăng nhập với Google" khi server chưa cấu
// hình Client ID/Secret, tránh hiện nút bấm vào là lỗi.
export function getAuthProviders() {
  return apiFetch<{ google: boolean }>('/auth/providers');
}

export function login(data: { email: string; password: string }) {
  return apiFetch<{ user: User; accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function forgotPassword(email: string) {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}
