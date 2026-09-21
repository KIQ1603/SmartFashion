import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// accessToken (JWT_ACCESS_EXPIRES=15m) hết hạn giữa phiên làm việc dài (vd. admin đang điền form
// sản phẩm lâu) - trước đây 401 sẽ đăng xuất ngay lập tức, mất luôn dữ liệu đang nhập. Giờ thử
// refresh 1 lần qua refresh_token cookie (httpOnly) trước khi chấp nhận đăng xuất.
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${API_URL}/auth/refresh`, null, { withCredentials: true })
      .then((res) => {
        useAuthStore.setState({ accessToken: res.data.accessToken });
        return true;
      })
      .catch(() => {
        useAuthStore.getState().clear();
        return false;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original?._isRetry && !original?.url?.includes('/auth/')) {
      original._isRetry = true;
      if (await tryRefreshToken()) return api(original);
      useAuthStore.getState().clear();
    }
    return Promise.reject(err);
  },
);
