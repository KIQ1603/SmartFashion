import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'admin';
}

interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  setAuth: (user: AdminUser, accessToken: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clear: () => set({ user: null, accessToken: null }),
    }),
    { name: 'sf_admin_auth' },
  ),
);
