'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, SquaresFour, Heart, Package, User } from '@phosphor-icons/react';
import { useAuthStore } from '@/store/auth';

const TABS = [
  { href: '/', label: 'Home', icon: House, match: (p: string) => p === '/' },
  { href: '/products', label: 'Categories', icon: SquaresFour, match: (p: string) => p.startsWith('/products') || p.startsWith('/categories') },
  { href: '/wishlist', label: 'Wishlist', icon: Heart, match: (p: string) => p.startsWith('/wishlist') },
  { href: '/orders', label: 'Orders', icon: Package, match: (p: string) => p.startsWith('/orders') },
];

/** Thanh điều hướng đáy - chỉ hiện trên mobile (md:hidden), bổ sung lối tắt tới 5 điểm đến
 * chính bên cạnh menu hamburger đã có sẵn ở Header (không thay thế, 2 pattern có thể cùng tồn
 * tại - khớp UI mẫu tham khảo "soft app premium" có tab bar cố định ở mọi màn hình).
 * fixed + z-40 (thấp hơn header z-40 cùng cấp nhưng header ở trên/tab bar ở dưới nên không chồng
 * lấn); RootLayout đã thêm pb-20 md:pb-0 cho <main> để nội dung không bị tab bar che mất. */
export default function MobileTabBar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const accountTab = user
    ? { href: '/profile', label: 'Account', icon: User, match: (p: string) => p.startsWith('/profile') }
    : { href: '/login', label: 'Account', icon: User, match: (p: string) => p.startsWith('/login') || p.startsWith('/register') };
  const tabs = [...TABS, accountTab];

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              active ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <tab.icon size={22} weight={active ? 'fill' : 'regular'} />
            {tab.label === 'Home' ? 'Trang chủ' : tab.label === 'Categories' ? 'Danh mục' : tab.label === 'Wishlist' ? 'Yêu thích' : tab.label === 'Orders' ? 'Đơn hàng' : 'Tài khoản'}
          </Link>
        );
      })}
    </nav>
  );
}
