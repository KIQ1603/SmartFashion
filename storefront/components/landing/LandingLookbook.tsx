import Link from 'next/link';
import Image from 'next/image';
import type { Product, Category } from '@/types';
import { formatVnd, primaryImage } from '@/lib/utils/format';

/**
 * "Mua theo phong cách" - lưới sản phẩm thật (không phải minh hoạ), dùng ảnh lớn 4:5 kiểu lookbook
 * thay vì ProductCard đầy đủ (vốn có nút giỏ hàng/yêu thích/so sánh) - ở đây chỉ cần gợi mở, click
 * vào ảnh mới vào trang sản phẩm để xem đủ lựa chọn size/màu.
 */
export default function LandingLookbook({ products, categories }: { products: Product[]; categories: Category[] }) {
  return (
    <section className="bg-warm py-16 sm:py-24">
      <div className="container-page">
        {categories.length > 0 && (
          <div className="mb-14 flex flex-wrap gap-2.5 border-b border-border-soft pb-10">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="section-heading">Được yêu thích nhất</h2>
          <Link href="/products" className="hidden shrink-0 text-sm font-medium underline-offset-4 hover:underline sm:inline">
            Xem tất cả sản phẩm
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="group block">
              <div className="relative mb-4 aspect-[4/5] w-full overflow-hidden rounded-md bg-muted">
                <Image
                  src={primaryImage(p.images)}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="text-sm font-medium text-foreground">{p.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatVnd(p.basePrice)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
