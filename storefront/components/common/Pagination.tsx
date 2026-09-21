'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';

/** Phân trang dạng số trang + prev/next, dùng chung cho các danh sách trong tài khoản (đơn hàng,
 * yêu thích...) - tách riêng để không lặp lại markup ở từng trang. */
export default function Pagination({
  page,
  totalPages,
  onChange,
  total,
  itemLabel = 'kết quả',
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  total?: number;
  itemLabel?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Trang {page}/{totalPages}
        {typeof total === 'number' && ` · ${total} ${itemLabel}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Trang trước"
          className="btn-outline min-h-9 min-w-9 p-0 disabled:opacity-40"
        >
          <CaretLeft size={15} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full px-2.5 text-sm font-medium transition-colors ${
              p === page ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Trang sau"
          className="btn-outline min-h-9 min-w-9 p-0 disabled:opacity-40"
        >
          <CaretRight size={15} />
        </button>
      </div>
    </div>
  );
}
