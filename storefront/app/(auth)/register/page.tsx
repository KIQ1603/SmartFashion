'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register, requestRegisterOtp, getAuthProviders } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [otp, setOtp] = useState('');
  // step 1 = nhập thông tin + gửi OTP, step 2 = nhập mã OTP nhận được qua email để hoàn tất.
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    getAuthProviders()
      .then((p) => setGoogleEnabled(p.google))
      .catch(() => setGoogleEnabled(false));
  }, []);

  async function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await requestRegisterOtp(form.email);
      setInfo('Đã gửi mã xác thực gồm 6 số tới email của bạn.');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Không gửi được mã xác thực.');
    } finally {
      setLoading(false);
    }
  }

  async function submitStep2(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user, accessToken } = await register({ ...form, otp });
      setAuth(user, accessToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center font-serif text-2xl font-medium text-foreground">Đăng ký</h1>

        {step === 1 ? (
          <form onSubmit={submitStep1} className="space-y-4 rounded-lg border border-border p-6 shadow-soft sm:p-8">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Họ tên</label>
              <input required className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Mật khẩu</label>
              <input
                required
                type="password"
                minLength={6}
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button disabled={loading} className="btn-primary min-h-11 w-full">
              {loading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
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
        ) : (
          <form onSubmit={submitStep2} className="space-y-4 rounded-lg border border-border p-6 shadow-soft sm:p-8">
            <div>
              <p className="text-sm font-medium text-foreground">Nhập mã xác thực</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mã gồm 6 số đã được gửi tới <span className="text-foreground">{form.email}</span>.
              </p>
            </div>
            <input
              required
              autoFocus
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="input text-center text-lg tracking-[0.5em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
            {info && !error && <p className="text-sm text-success">{info}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button disabled={loading || otp.length !== 6} className="btn-primary min-h-11 w-full">
              {loading ? 'Đang xác nhận...' : 'Xác nhận & Đăng ký'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="btn-ghost w-full"
            >
              Đổi thông tin / gửi lại mã
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
