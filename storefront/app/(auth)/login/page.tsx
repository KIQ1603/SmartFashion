'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, logout, getAuthProviders } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    getAuthProviders()
      .then((p) => setGoogleEnabled(p.google))
      .catch(() => setGoogleEnabled(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user, accessToken } = await login(form);
      // Tài khoản admin chỉ dùng ở trang quản trị riêng (admin-dashboard) - không setAuth() nếu
      // để lọt qua, Header sẽ hiện "Quản trị viên" và có thể mua sắm như khách hàng thường, lẫn
      // lộn 2 vai trò (đối xứng với admin-dashboard đã chặn tài khoản customer ở chiều ngược lại).
      // login() vừa rồi đã set refresh_token cookie ở backend - phải gọi logout() thật để xóa
      // cookie đó, không chỉ đơn giản bỏ qua setAuth() ở client.
      if (user.role === 'admin') {
        useAuthStore.setState({ accessToken });
        await logout().catch(() => {});
        useAuthStore.getState().clear();
        setError('Tài khoản quản trị viên không dùng để mua sắm tại đây. Vui lòng đăng nhập ở trang quản trị.');
        return;
      }
      setAuth(user, accessToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center font-serif text-2xl font-medium text-foreground">Đăng nhập</h1>
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-border p-6 shadow-soft sm:p-8">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Mật khẩu</label>
            <input required type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={loading} className="btn-primary min-h-11 w-full">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          {googleEnabled && (
            <>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                hoặc
                <span className="h-px flex-1 bg-border" />
              </div>
              <GoogleAuthButton />
            </>
          )}
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-2">
            Đăng ký
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground/70">
          Demo: customer@smartfashion.dev / Customer@123
        </p>
      </div>
    </div>
  );
}
