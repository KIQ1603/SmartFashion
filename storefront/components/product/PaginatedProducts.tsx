'use client';

import { useRef, useState } from 'react';
import type { Product } from '@/types';
import { listProducts, type ProductListParams } from '@/lib/api/products';
import ProductGrid from './ProductGrid';
import Pagination from '@/components/common/Pagination';

/**
 * Phân trang dạng số trang (thay cho "Xem thêm" tải-dần trước đây) - người dùng báo "Xem thêm"
 * không hiện thêm sản phẩm dù test tự động nhiều lần đều thấy hoạt động bình thường; đổi sang
 * điều hướng trang rõ ràng (giống lịch sử đơn hàng đã làm) để tránh hẳn lớp trạng thái "nối thêm
 * vào danh sách cũ" vốn khó chẩn đoán từ xa - mỗi lần đổi trang là 1 lần thay MỚI toàn bộ lưới.
 */
export default function PaginatedProducts({
  initialItems,
  total,
  pageSize,
  filters,
}: {
  initialItems: Product[];
  total: number;
  pageSize: number;
  filters: ProductListParams;
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function goToPage(next: number) {
    if (next === page || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listProducts({ ...filters, page: next, pageSize });
      setItems(res.items);
      setPage(next);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err: any) {
      setError(err.message || 'Không tải được trang này, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={topRef}>
      {loading ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-[3/4] w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <ProductGrid products={items} />
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={goToPage} total={total} itemLabel="sản phẩm" />
    </div>
  );
}
