'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowsLeftRight, Star, Trash, X } from '@phosphor-icons/react';
import { useCompareStore } from '@/store/compare';
import { getProduct } from '@/lib/api/products';
import { formatVnd, primaryImage } from '@/lib/utils/format';
import type { Product } from '@/types';

const ROWS: Array<{ label: string; render: (p: Product) => React.ReactNode }> = [
  { label: 'Giá', render: (p) => <span className="font-semibold text-foreground">{formatVnd(p.basePrice)}</span> },
  { label: 'Thương hiệu', render: (p) => p.brand || '—' },
  { label: 'Chất liệu', render: (p) => p.material || '—' },
  { label: 'Danh mục', render: (p) => p.category?.name || '—' },
  {
    // getProduct() (chi tiết) trả mảng reviews thô, không có avgRating/reviewCount tính sẵn như
    // API danh sách - tự tính từ p.reviews để khớp đúng với những gì trang chi tiết hiển thị.
    label: 'Đánh giá',
    render: (p) => {
      const count = p.reviews?.length ?? 0;
      if (count === 0) return 'Chưa có đánh giá';
      const avg = p.reviews!.reduce((s, r) => s + r.rating, 0) / count;
      return (
        <span className="inline-flex items-center gap-1">
          <Star size={13} weight="fill" className="text-accent" /> {avg.toFixed(1)} ({count})
        </span>
      );
    },
  },
  { label: 'Size', render: (p) => [...new Set(p.variants.map((v) => v.size))].join(', ') || '—' },
  { label: 'Màu', render: (p) => [...new Set(p.variants.map((v) => v.color))].join(', ') || '—' },
  {
    label: 'Tồn kho',
    render: (p) => {
      const total = p.variants.reduce((s, v) => s + v.stockQuantity, 0);
      return total > 0 ? `Còn ${total} sản phẩm` : 'Hết hàng';
    },
  },
];

export default function ComparePage() {
  const { productIds, remove, clear } = useCompareStore();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      return;
    }
    setProducts(null);
    Promise.all(productIds.map((id) => getProduct(id).catch(() => null))).then((results) =>
      setProducts(results.filter(Boolean) as Product[]),
    );
  }, [productIds]);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-9 flex items-end justify-between">
        <div>
          <h1 className="section-heading">So sánh sản phẩm</h1>
          <p className="mt-2 text-sm text-muted-foreground">Đối chiếu giá, chất liệu và tồn kho trước khi quyết định.</p>
        </div>
        {!!productIds.length && (
          <button onClick={clear} className="btn-ghost gap-1.5 text-muted-foreground">
            <Trash size={15} /> Xóa tất cả
          </button>
        )}
      </div>

      {products === null ? (
        <div className="skeleton h-64 w-full" />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-20 text-center">
          <ArrowsLeftRight size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Chưa có sản phẩm nào để so sánh.</p>
          <Link href="/products" className="btn-primary">
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className="w-32" />
                {products.map((p) => (
                  <th key={p.id} className="px-4 pb-5 text-left align-bottom">
                    <div className="relative">
                      <button
                        onClick={() => remove(p.id)}
                        aria-label={`Bỏ ${p.name} khỏi so sánh`}
                        className="absolute right-1 top-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm"
                      >
                        <X size={12} />
                      </button>
                      <Link href={`/products/${p.slug}`} className="block">
                        <div className="relative aspect-[3/4] w-40 overflow-hidden rounded-lg bg-muted">
                          <Image src={primaryImage(p.images)} alt={p.name} fill sizes="160px" className="object-cover" />
                        </div>
                        <p className="mt-2.5 line-clamp-2 w-40 text-sm font-medium text-foreground">{p.name}</p>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="py-4 pr-4 text-sm font-medium text-muted-foreground">{row.label}</td>
                  {products.map((p) => (
                    <td key={p.id} className="px-4 py-4 text-sm text-foreground">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
