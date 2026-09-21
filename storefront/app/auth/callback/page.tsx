'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMe } from '@/lib/api/users';
import { logout } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth';

/** Đích redirect sau khi đăng nhập Google (khớp URL backend dùng ở AuthController.googleCallback).
 * Backend chỉ chuyển accessToken qua query - trang này tự gọi /users/me để lấy thông tin user rồi
 * mới setAuth() đầy đủ (user + accessToken), đồng bộ với cách login()/register() thường làm. */
export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = params.get('error');
    if (errorParam) {
      setError(errorParam);
      return;
    }
    const accessToken = params.get('accessToken');
    if (!accessToken) {
      setError('Không nhận được thông tin đăng nhập từ Google.');
      return;
    }
    // Set tạm accessToken để getMe() có Authorization header - đối xứng với login page: tài khoản
    // admin không được phép đăng nhập ở storefront qua Google, tránh lẫn vai trò với trang quản trị.
    useAuthStore.setState({ accessToken });
    getMe()
      .then(async (user) => {
        if (user.role === 'admin') {
          await logout().catch(() => {});
          useAuthStore.getState().clear();
          setError('Tài khoản quản trị viên không dùng để mua sắm tại đây.');
          return;
        }
        setAuth(user, accessToken);
        router.replace('/');
      })
      .catch(() => setError('Đăng nhập Google thất bại, vui lòng thử lại.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-10 text-center">
      {error ? (
        <>
          <p className="text-sm text-destructive">{error}</p>
          <a href="/login" className="btn-outline">
            Quay lại đăng nhập
          </a>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Đang hoàn tất đăng nhập...</p>
      )}
    </div>
  );
}
