'use client';

import { useEffect, useState } from 'react';
import { Sparkle } from '@phosphor-icons/react';
import type { Product } from '@/types';
import { getHomepageRecommendations } from '@/lib/api/recommendations';
import ProductGrid from '@/components/product/ProductGrid';
import { Reveal } from '@/components/common/Reveal';

const ALGORITHM_LABEL: Record<string, string> = {
  popularity: 'Sản phẩm phổ biến',
  content_based: 'Vì bạn vừa xem',
  collaborative: 'Chọn riêng cho bạn',
  hybrid: 'Có thể bạn sẽ thích',
};

/**
 * Khối gợi ý cá nhân hóa ở trang chủ - gọi GET /recommendations/homepage.
 * Là client component vì cần đính kèm JWT (nếu đã đăng nhập) từ localStorage để cá nhân hóa;
 * với Guest/lỗi mạng, Core Backend tự fallback về Popularity-based (mục 4.3 kiến trúc kỹ thuật).
 * `dark` áp dụng khi đặt trên nền tối (khối tách biệt ở trang chủ). Badge "Gợi ý AI" trên từng
 * card (ProductCard `aiMatched`) để khối này đọc như kết quả mô hình chọn, không phải danh sách tĩnh.
 */
export default function PersonalizedRecommendations({ dark = false }: { dark?: boolean }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [algorithm, setAlgorithm] = useState('popularity');

  useEffect(() => {
    getHomepageRecommendations()
      .then((res) => {
        setProducts(res.products);
        setAlgorithm(res.algorithm);
      })
      .catch(() => setProducts([]));
  }, []);

  if (products === null) {
    return (
      <section className="container-page py-8 sm:py-20">
        <div className={`mb-8 h-8 w-64 animate-pulse rounded-md ${dark ? 'bg-background/10' : 'bg-muted'}`} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`aspect-[3/4] w-full animate-pulse rounded-md ${dark ? 'bg-background/10' : 'bg-muted'}`} />
          ))}
        </div>
      </section>
    );
  }
  if (products.length === 0) return null;

  return (
    <section className="container-page py-8 sm:py-20">
      <Reveal className="mb-5 max-w-lg sm:mb-8">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider ${dark ? 'text-accent' : 'text-accent'}`}
        >
          <Sparkle size={13} weight="fill" aria-hidden />
          Được chọn riêng cho bạn
        </span>
        <h2 className={`section-heading mt-2 ${dark ? 'text-background' : ''}`}>{ALGORITHM_LABEL[algorithm] || 'Gợi ý cho bạn'}</h2>
        <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-background/60' : 'text-muted-foreground'}`}>
          Mô hình học từ những sản phẩm bạn đã xem, lưu và mua để xếp hạng lại toàn bộ danh mục
          riêng cho bạn.
        </p>
      </Reveal>
      <ProductGrid products={products} dark={dark} aiMatched />
    </section>
  );
}
