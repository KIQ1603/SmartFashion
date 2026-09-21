'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Faders, X } from '@phosphor-icons/react';
import type { Category } from '@/types';
import type { ProductFacets } from '@/lib/api/products';
import { colorToHex, formatVnd } from '@/lib/utils/format';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'bestselling', label: 'Bán chạy' },
];

interface Props {
  categories: Category[];
  facets: ProductFacets;
  currentCategory?: string;
  currentSort?: string;
  currentBrand?: string;
  currentColor?: string;
  currentMinPrice?: number;
  currentMaxPrice?: number;
  currentOnSale?: boolean;
  currentQuery?: string;
  total: number;
}

export default function ShopToolbar({
  categories,
  facets,
  currentCategory,
  currentSort,
  currentBrand,
  currentColor,
  currentMinPrice,
  currentMaxPrice,
  currentOnSale,
  currentQuery,
  total,
}: Props) {
  const router = useRouter();
  // Mặc định mở nếu đang có bất kỳ bộ lọc/tìm kiếm nào active - khớp yêu cầu "lọc/tìm xong vẫn
  // hiện bảng filter, chỉ tắt khi người dùng tự tắt". Sau đó hoàn toàn do người dùng bấm toggle,
  // không tự đóng lại khi đổi filter/sort (component không bị remount giữa các lần điều hướng).
  const [filtersOpen, setFiltersOpen] = useState(
    !!(currentCategory || currentBrand || currentColor || currentMinPrice || currentMaxPrice || currentOnSale || currentQuery),
  );
  const [minPrice, setMinPrice] = useState(currentMinPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice?.toString() ?? '');

  function setParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  }

  function applyPriceRange(e: React.FormEvent) {
    e.preventDefault();
    setParams({ minPrice: minPrice || null, maxPrice: maxPrice || null });
  }

  const activeFilterCount = [currentCategory, currentBrand, currentColor, currentMinPrice, currentMaxPrice, currentOnSale].filter(
    Boolean,
  ).length;

  function clearAll() {
    setMinPrice('');
    setMaxPrice('');
    // Giữ lại q (tìm kiếm) - "Xóa bộ lọc" chỉ xóa filter, không hủy luôn từ khóa đang tìm.
    const params = new URLSearchParams();
    if (currentQuery) params.set('q', currentQuery);
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="btn-outline min-h-10 gap-2"
          >
            <Faders size={16} />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
          {currentQuery && (
            <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:inline-flex">
              Kết quả cho <span className="font-medium text-foreground">"{currentQuery}"</span>
              <button onClick={() => setParams({ q: null })} aria-label="Xóa từ khóa tìm kiếm" className="cursor-pointer text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{total} sản phẩm</p>
          <select
            value={currentSort || 'newest'}
            onChange={(e) => setParams({ sort: e.target.value })}
            className="input min-h-10 w-auto cursor-pointer py-2"
            aria-label="Sắp xếp"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtersOpen && (
        <div className="mt-4 space-y-5 border-t border-border pt-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Danh mục</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/products"
                className={`min-h-9 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  !currentCategory ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground'
                }`}
              >
                Tất cả
              </Link>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setParams({ category: currentCategory === c.slug ? null : c.slug })}
                  className={`min-h-9 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    currentCategory === c.slug
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {facets.brands.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Thương hiệu</p>
              <div className="flex flex-wrap gap-2">
                {facets.brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setParams({ brand: currentBrand === b ? null : b })}
                    className={`min-h-9 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      currentBrand === b
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {facets.colors.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Màu sắc</p>
              <div className="flex flex-wrap gap-2.5">
                {facets.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setParams({ color: currentColor === c ? null : c })}
                    aria-pressed={currentColor === c}
                    className={`h-8 w-8 cursor-pointer rounded-full ring-1 ring-inset ring-black/10 transition-shadow ${
                      currentColor === c ? 'ring-2 ring-foreground ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: colorToHex(c) }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-6">
            {(facets.maxPrice > 0) && (
              <form onSubmit={applyPriceRange} className="flex items-end gap-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Khoảng giá ({formatVnd(facets.minPrice)} – {formatVnd(facets.maxPrice)})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="Từ"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="input min-h-9 w-28 py-1.5 text-sm"
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Đến"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="input min-h-9 w-28 py-1.5 text-sm"
                    />
                    <button type="submit" className="btn-outline min-h-9 px-3 text-sm">
                      Áp dụng
                    </button>
                  </div>
                </div>
              </form>
            )}

            <label className="mb-0.5 flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={!!currentOnSale}
                onChange={(e) => setParams({ onSale: e.target.checked ? '1' : null })}
                className="h-4 w-4 cursor-pointer accent-accent"
              />
              Đang giảm giá
            </label>

            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="mb-0.5 min-h-9 cursor-pointer text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
