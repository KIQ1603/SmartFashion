import { getOrCreateSessionId } from '../utils/session';
import { useAuthStore } from '@/store/auth';

// Server Component (SSR, chạy trong container) phải gọi qua hostname nội bộ Docker (vd: http://core-backend:4000/api/v1);
// Client Component (chạy trong trình duyệt của người dùng) phải gọi qua URL truy cập được từ host (NEXT_PUBLIC_API_URL).
// Dùng chung 1 URL cho cả hai phía sẽ gãy khi chạy trong Docker Compose - đây là lý do cần tách biệt 2 biến.
const SERVER_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// accessToken (JWT_ACCESS_EXPIRES=15m) hết hạn giữa phiên duyệt web bình thường - refresh_token
// (cookie httpOnly, 7 ngày) vẫn còn hạn. Gọi thẳng useAuthStore.getState()/.setState() (không
// phải hook, dùng được ngoài component) thay vì tự parse localStorage để tránh đọc dữ liệu lệch
// nếu setAuth() vừa chạy cùng tick nhưng chưa kịp ghi xuống localStorage.
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshToken(apiUrl: string): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${apiUrl}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (!res.ok) throw new Error('refresh failed');
        const data = await res.json();
        useAuthStore.setState({ accessToken: data.accessToken });
        return true;
      } catch {
        // refresh_token cũng đã hết hạn/không hợp lệ - đăng xuất để UI phản ánh đúng trạng thái,
        // tránh vòng lặp gọi refresh vô ích ở mọi request sau đó trong cùng phiên.
        useAuthStore.getState().clear();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/**
 * Fetch wrapper dùng chung cho cả Server Component (SSR, không có token/session -> API trả
 * dữ liệu công khai / fallback popularity) lẫn Client Component (đính kèm JWT + x-session-id).
 */
export async function apiFetch<T = any>(path: string, options: RequestInit = {}, _isRetry = false): Promise<T> {
  const isServer = typeof window === 'undefined';
  const API_URL = isServer ? SERVER_API_URL : CLIENT_API_URL;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((options.headers as any) || {}) };

  if (!isServer) {
    headers['x-session-id'] = getOrCreateSessionId();
    const token = useAuthStore.getState().accessToken;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: options.cache ?? 'no-store',
    credentials: 'include',
  });

  // Thử refresh accessToken 1 lần trước khi báo lỗi - không áp dụng cho chính /auth/* (tránh vòng
  // lặp refresh khi đang login/register, hoặc khi refresh() tự nó cũng trả 401).
  if (res.status === 401 && !isServer && !_isRetry && !path.startsWith('/auth/')) {
    const refreshed = await tryRefreshToken(API_URL);
    if (refreshed) return apiFetch<T>(path, options, true);
  }

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      const raw = body?.error?.message ?? body?.error ?? message;
      message = Array.isArray(raw) ? raw.join(', ') : raw;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
