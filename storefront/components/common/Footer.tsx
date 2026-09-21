import Link from 'next/link';
import { MapPin, Phone, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr';
import { getSiteSettings } from '@/lib/api/settings';

const COLUMNS = [
  {
    title: 'Mua sắm',
    links: [
      { href: '/products', label: 'Tất cả sản phẩm' },
      { href: '/categories/ao', label: 'Áo' },
      { href: '/categories/quan', label: 'Quần' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { href: '/orders', label: 'Đơn hàng của tôi' },
      { href: '/wishlist', label: 'Sản phẩm yêu thích' },
      { href: '/profile', label: 'Thông tin cá nhân' },
    ],
  },
];

export default async function Footer() {
  const settings = await getSiteSettings().catch(() => null);
  const hasContactInfo = !!(settings?.storeAddress || settings?.storePhone || settings?.storeEmail);

  return (
    <footer className="mt-24 bg-muted">
      <div className="container-page grid grid-cols-2 gap-8 py-14 sm:grid-cols-5">
        <div className="col-span-2 sm:col-span-2">
          <p className="font-serif text-lg font-semibold">SmartFashion</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            Website thương mại điện tử bán quần áo tích hợp hệ thống gợi ý sản phẩm — đồ án/khóa
            luận tốt nghiệp.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-medium text-foreground">{col.title}</p>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {/* Thông tin liên hệ - admin cấu hình qua trang Cài đặt, để trống mục nào thì ẩn hẳn mục
            đó, chưa cấu hình gì thì ẩn cả cột (không hiện placeholder/dữ liệu giả). */}
        {hasContactInfo && (
          <div>
            <p className="text-sm font-medium text-foreground">Liên hệ</p>
            <ul className="mt-3 space-y-2.5">
              {settings?.storeAddress && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{settings.storeAddress}</span>
                </li>
              )}
              {settings?.storePhone && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone size={15} className="shrink-0" aria-hidden />
                  <a href={`tel:${settings.storePhone}`} className="transition-colors hover:text-foreground">
                    {settings.storePhone}
                  </a>
                </li>
              )}
              {settings?.storeEmail && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <EnvelopeSimple size={15} className="shrink-0" aria-hidden />
                  <a href={`mailto:${settings.storeEmail}`} className="transition-colors hover:text-foreground">
                    {settings.storeEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-border-soft py-6">
        <div className="container-page flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SmartFashion. Đồ án/Khóa luận tốt nghiệp.</p>
          <div className="flex gap-5">
            <Link href="/legal/privacy" className="transition-colors hover:text-foreground">
              Chính sách bảo mật
            </Link>
            <Link href="/legal/terms" className="transition-colors hover:text-foreground">
              Điều khoản dịch vụ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
