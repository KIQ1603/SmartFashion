'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Reveal } from '@/components/common/Reveal';

/** Chỉ hiện với khách chưa đăng nhập — tránh mời "Đăng ký" người đã có tài khoản. */
export default function GuestCtaBanner() {
  const user = useAuthStore((s) => s.user);
  if (user) return null;

  return (
    <section className="border-y border-border bg-foreground text-background">
      <Reveal className="container-page flex flex-col items-center gap-4 py-10 text-center sm:gap-5 sm:py-20">
        <h2 className="max-w-md text-balance font-serif text-xl font-medium leading-tight sm:text-3xl">
          Tạo tài khoản để hệ thống học phong cách của riêng bạn
        </h2>
        <p className="max-w-sm text-balance text-sm text-background/70">
          Càng tương tác nhiều, gợi ý càng chính xác — dựa trên sản phẩm bạn xem, lưu và mua.
        </p>
        <Link href="/register" className="btn-primary bg-background text-foreground hover:bg-background/90">
          Đăng ký
        </Link>
      </Reveal>
    </section>
  );
}
