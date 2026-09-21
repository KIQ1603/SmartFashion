'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  // zustand persist đọc localStorage bất đồng bộ (tránh lệch giữa HTML SSR và lần render đầu ở
  // client) - ngay lần render đầu tiên, TRƯỚC KHI rehydrate xong, user luôn là null dù thật ra đã
  // đăng nhập. Các trang cần đăng nhập (checkout/profile/orders/wishlist) trước đây kiểm tra
  // "if (!user) router.push('/login')" ngay trong effect đầu tiên -> hard reload/vào thẳng URL
  // luôn bị bật về /login dù đang đăng nhập thật. Cờ này để các trang đó đợi rehydrate xong rồi
  // mới quyết định có redirect hay không.
  hasHydrated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      hasHydrated: false,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clear: () => set({ user: null, accessToken: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'sf_auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
