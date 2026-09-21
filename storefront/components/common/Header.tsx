'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowsLeftRight, Heart, List, MagnifyingGlass, ShoppingBag, User, X } from '@phosphor-icons/react';
import { useAuthStore } from '@/store/auth';
import { useCompareStore } from '@/store/compare';
import { getCart } from '@/lib/api/cart';
import { logout } from '@/lib/api/auth';

const NAV_LINKS = [
  { href: '/products', label: 'Tất cả sản phẩm' },
  { href: '/categories/ao', label: 'Áo' },
  { href: '/categories/quan', label: 'Quần' },
];

export default function Header() {
  const { user, clear } = useAuthStore();
  const compareCount = useCompareStore((s) => s.productIds.length);
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Chỉ trang chủ có hero full-bleed để navbar "nằm trên ảnh" - trang khác vẫn sticky nền đặc
  // như trước, không đổi gì cả.
  const isHome = pathname === '/';
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [revealed, setRevealed] = useState(true);
  const [nearTop, setNearTop] = useState(false);

  useEffect(() => {
    getCart()
      .then((cart) => setCartCount(cart.items?.reduce((s, i) => s + i.quantity, 0) || 0))
      .catch(() => setCartCount(0));
  }, [user]);

  // Chốt chặn cho phiên admin đăng nhập từ trước khi có kiểm tra role ở trang đăng nhập (fix cũ
  // chỉ chặn được lượt đăng nhập MỚI, không tự đăng xuất phiên admin đang có sẵn trong trình
  // duyệt) - Header render ở mọi trang nên đặt guard ở đây để bắt được ngay lần load kế tiếp.
  useEffect(() => {
    if (user?.role === 'admin') {
      logout()
        .catch(() => {})
        .finally(() => clear());
    }
  }, [user, clear]);

  // Navbar trong suốt/ẩn khi còn nằm trên ảnh hero (chỉ trang chủ) - hiện lại khi cuộn lên hoặc rê
  // chuột gần mép trên, tự đặc lại thành thanh nền trắng thường một khi đã cuộn qua khỏi hero
  // (không còn ảnh phía dưới để "nằm trên" nữa).
  useEffect(() => {
    if (!isHome) return;
    let lastY = window.scrollY;

    function handleScroll() {
      const y = window.scrollY;
      const past = y > window.innerHeight * 0.82;
      setScrolledPastHero(past);
      if (!past) {
        if (y <= 4 || y < lastY - 4) setRevealed(true);
        else if (y > lastY + 4) setRevealed(false);
      }
      lastY = y;
    }
    function handleMouseMove(e: MouseEvent) {
      setNearTop(e.clientY < 96);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHome]);

  // Còn trong vùng hero (trang chủ, chưa cuộn qua) -> nền trong suốt/chữ trắng. Mở menu mobile thì
  // luôn đặc lại (danh sách link cần nền rõ để đọc được, không để trong suốt đè lên ảnh).
  const transparent = isHome && !scrolledPastHero && !mobileOpen;
  const shouldHide = transparent && !revealed && !nearTop;

  return (
    <header
      className={`${isHome ? 'fixed inset-x-0' : 'sticky'} top-3 z-40 mx-3 rounded-2xl border shadow-lift backdrop-blur transition-all duration-300 sm:top-4 sm:mx-4 lg:mx-6 ${
        transparent ? 'border-white/15 bg-black/25' : 'border-border bg-background/95'
      } ${shouldHide ? 'pointer-events-none -translate-y-[calc(100%+2rem)] opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <button
          className={`btn-ghost -ml-2 p-2 md:hidden ${transparent ? 'text-white hover:bg-white/15 hover:text-white' : ''}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
        >
          {mobileOpen ? <X size={22} /> : <List size={22} />}
        </button>

        <Link href="/" className={`font-serif text-xl font-semibold tracking-tight ${transparent ? 'text-white' : ''}`}>
          SmartFashion
        </Link>

        <nav className={`hidden gap-7 text-sm font-medium md:flex ${transparent ? 'text-white/75' : 'text-muted-foreground'}`}>
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`relative py-1 transition-colors ${transparent ? 'hover:text-white' : 'hover:text-foreground'} ${
                  active ? (transparent ? 'text-white' : 'text-foreground') : ''
                }`}
              >
                {link.label}
                {active && (
                  <span className={`absolute -bottom-[19px] left-0 right-0 h-0.5 ${transparent ? 'bg-white' : 'bg-foreground'}`} aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Search dạng pill có nền (không chỉ viền) - khớp phong cách "soft app premium" tham khảo,
            khác biệt trực quan với input dạng field thường (địa chỉ, đánh giá...) dùng .input gốc. */}
        <form action="/products" className="hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${transparent ? 'text-white/70' : 'text-muted-foreground'}`}
              aria-hidden
            />
            <input
              name="q"
              placeholder="Tìm kiếm sản phẩm..."
              className={`input rounded-full pl-10 ${
                transparent
                  ? 'border-white/25 bg-white/10 text-white placeholder:text-white/60 focus:border-white/50 focus:bg-white/15'
                  : 'border-transparent bg-muted focus:border-foreground focus:bg-card'
              }`}
            />
          </div>
        </form>

        <div className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <Link
                href="/wishlist"
                className={`btn-ghost p-2 ${transparent ? 'text-white hover:bg-white/15 hover:text-white' : ''}`}
                aria-label="Sản phẩm yêu thích"
              >
                <Heart size={20} />
              </Link>
              <Link
                href="/orders"
                className={`hidden px-2 py-1.5 transition-colors sm:inline-block ${
                  transparent ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Đơn hàng
              </Link>
              <Link
                href="/profile"
                className={`btn-ghost hidden items-center gap-1.5 sm:inline-flex ${transparent ? 'text-white hover:bg-white/15 hover:text-white' : ''}`}
              >
                <User size={20} />
                <span className="max-w-[7rem] truncate">{user.fullName}</span>
              </Link>
              <button
                onClick={() => clear()}
                className={`btn-ghost hidden sm:inline-flex ${transparent ? 'text-white hover:bg-white/15 hover:text-white' : ''}`}
                aria-label="Đăng xuất"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={`btn-ghost hidden sm:inline-flex ${transparent ? 'text-white hover:bg-white/15 hover:text-white' : ''}`}>
                Đăng nhập
              </Link>
              <Link href="/register" className="btn-primary ml-2 hidden sm:inline-flex">
                Đăng ký
              </Link>
            </>
          )}

          <Link
            href="/compare"
            className={`btn-ghost relative p-2 ${transparent ? 'text-white hover:bg-white/15 hover:text-white' : ''}`}
            aria-label={`So sánh, ${compareCount} sản phẩm`}
          >
            <ArrowsLeftRight size={20} />
            {compareCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground">
                {compareCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className={`btn-ghost relative p-2 ${transparent ? 'text-white hover:bg-white/15 hover:text-white' : ''}`}
            aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <nav className="container-page flex flex-col gap-1 border-t border-border pb-4 pt-2 text-sm font-medium md:hidden">
          <form action="/products" className="py-2">
            <div className="relative">
              <MagnifyingGlass size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input name="q" placeholder="Tìm kiếm sản phẩm..." className="input rounded-full border-transparent bg-muted pl-10 focus:border-foreground focus:bg-card" />
            </div>
          </form>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`rounded-md px-2 py-2.5 hover:bg-muted hover:text-foreground ${
                pathname === link.href ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
            {user ? (
              <>
                <Link href="/orders" className="rounded-md px-2 py-2.5 hover:bg-muted">Đơn hàng</Link>
                <Link href="/profile" className="rounded-md px-2 py-2.5 hover:bg-muted">Tài khoản ({user.fullName})</Link>
                <button onClick={() => clear()} className="rounded-md px-2 py-2.5 text-left text-muted-foreground hover:bg-muted">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-md px-2 py-2.5 hover:bg-muted">Đăng nhập</Link>
                <Link href="/register" className="rounded-md px-2 py-2.5 hover:bg-muted">Đăng ký</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
