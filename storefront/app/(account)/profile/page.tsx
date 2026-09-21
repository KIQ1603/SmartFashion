'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin } from '@phosphor-icons/react';
import { getMe, updateMe } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth';
import type { User } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setAuth, accessToken, hasHydrated } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Đợi rehydrate xong mới quyết định redirect - xem giải thích chi tiết ở store/auth.ts.
    if (!hasHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    // Không .catch() sẽ để lộ "Uncaught (in promise)" khi accessToken hết hạn và refresh cũng
    // thất bại (refresh_token hết hạn/không hợp lệ) - lúc đó điều hướng lại về đăng nhập.
    getMe()
      .then(setProfile)
      .catch(() => router.push('/login'));
  }, [hasHydrated, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    try {
      const updated = await updateMe({ fullName: profile.fullName, gender: profile.gender, birthYear: profile.birthYear });
      if (accessToken) setAuth(updated, accessToken);
      setMessage('Đã lưu thay đổi.');
    } catch (err: any) {
      setMessage(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  }

  if (!profile) return <div className="container-page py-10">Đang tải...</div>;

  return (
    <div className="container-page max-w-lg py-10 sm:py-14">
      <h1 className="section-heading mb-9">Tài khoản của tôi</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input disabled className="input bg-muted" value={profile.email} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Họ tên</label>
          <input className="input" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Giới tính</label>
          <select className="input" value={profile.gender || ''} onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}>
            <option value="">-- Chọn --</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Năm sinh</label>
          <input
            type="number"
            className="input"
            value={profile.birthYear || ''}
            onChange={(e) => setProfile({ ...profile, birthYear: Number(e.target.value) })}
          />
        </div>
        {message && <p className="text-sm text-green-600">{message}</p>}
        <button className="btn-primary">Lưu thay đổi</button>
      </form>

      {/* Sổ địa chỉ trước đây chỉ sửa được lồng trong luồng checkout - thêm lối vào riêng ở đây để
          khách quản lý địa chỉ (thêm/sửa/xóa/đặt mặc định) mà không cần đang đặt hàng dở. */}
      <Link
        href="/addresses"
        className="mt-6 flex items-center justify-between rounded-lg border border-border bg-warm p-5 shadow-soft transition-colors hover:border-foreground/40"
      >
        <span className="flex items-center gap-3">
          <MapPin size={20} className="text-accent" />
          <span>
            <span className="block text-sm font-medium text-foreground">Sổ địa chỉ</span>
            <span className="block text-xs text-muted-foreground">Quản lý địa chỉ giao hàng</span>
          </span>
        </span>
        <span className="text-sm text-muted-foreground">Xem →</span>
      </Link>
    </div>
  );
}
