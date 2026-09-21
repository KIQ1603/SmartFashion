'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package } from '@phosphor-icons/react';
import { listOrders } from '@/lib/api/orders';
import { formatVnd, primaryImage } from '@/lib/utils/format';
import { useAuthStore } from '@/store/auth';
import Pagination from '@/components/common/Pagination';
import type { Order } from '@/types';

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  packed: 'Đã đóng gói',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

// Cùng bảng màu semantic với trang chi tiết đơn hàng - badge đầy đủ (không chỉ 1 chấm nhỏ) để
// phân biệt rõ đơn nào đang chờ/đã hủy/đã giao ngay trong danh sách, không cần bấm vào từng đơn.
const STATUS_BADGE: Record<Order['status'], string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-blue-500/10 text-blue-600',
  packed: 'bg-cyan-600/10 text-cyan-700',
  shipping: 'bg-blue-500/10 text-blue-600',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

const STATUS_FILTERS: Array<{ value: Order['status'] | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: STATUS_LABEL.pending },
  { value: 'confirmed', label: STATUS_LABEL.confirmed },
  { value: 'packed', label: STATUS_LABEL.packed },
  { value: 'shipping', label: STATUS_LABEL.shipping },
  { value: 'delivered', label: STATUS_LABEL.delivered },
  { value: 'cancelled', label: STATUS_LABEL.cancelled },
];

const PAGE_SIZE = 8;

export default function OrdersPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Đợi rehydrate xong mới quyết định redirect - xem giải thích chi tiết ở store/auth.ts.
    if (!hasHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    // Không .catch() sẽ để lộ "Uncaught (in promise)" khi accessToken hết hạn và refresh cũng
    // thất bại (refresh_token hết hạn/không hợp lệ) - lúc đó điều hướng lại về đăng nhập.
    listOrders({ status: statusFilter === 'all' ? undefined : statusFilter, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setOrders(res.items);
        setTotal(res.total);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [hasHydrated, user, router, statusFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!orders) {
    return (
      <div className="container-page py-10">
        <div className="skeleton mb-8 h-8 w-52" />
        <div className="space-y-4">
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="section-heading mb-6">Lịch sử đơn hàng</h1>

      {/* Bộ lọc trạng thái - đổi filter thì quay về trang 1, tránh kẹt ở 1 trang trống nếu bộ lọc
          mới có ít kết quả hơn trang đang xem. */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setStatusFilter(f.value);
              setPage(1);
            }}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-warm text-foreground hover:border-foreground/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-20 text-center">
          <Package size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">
            {statusFilter === 'all' ? 'Bạn chưa có đơn hàng nào.' : 'Không có đơn hàng nào ở trạng thái này.'}
          </p>
          <Link href="/products" className="btn-primary">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <>
          {/* 1 khung lớn duy nhất bọc toàn bộ danh sách (thay vì mỗi đơn 1 khung rời rạc) - rõ ràng
              hơn hẳn, các đơn ngăn cách nhau bằng divide-y bên trong cùng 1 card có shadow. */}
          <div
            className={`divide-y divide-border-soft overflow-hidden rounded-lg border border-border bg-warm shadow-soft transition-opacity ${loading ? 'opacity-60' : ''}`}
          >
            {orders.map((o) => {
              const firstItem = o.items[0];
              const otherCount = o.items.length - 1;
              return (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-card sm:p-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {firstItem && (
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        <Image src={primaryImage(firstItem.variant.product.images)} alt="" fill sizes="48px" className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0">
                      {/* Tên sản phẩm thật thay vì chỉ mã đơn trừu tượng - mã đơn vẫn giữ lại làm
                          thông tin phụ, không phải điều đầu tiên khách cần nhận ra đơn này là gì. */}
                      <p className="truncate font-medium text-foreground">
                        {firstItem?.variant.product.name || 'Đơn hàng'}
                        {otherCount > 0 && <span className="font-normal text-muted-foreground"> và {otherCount} sản phẩm khác</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Mã đơn #{o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="font-semibold tabular-nums text-foreground">{formatVnd(o.totalAmount)}</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} total={total} itemLabel="đơn hàng" />
        </>
      )}
    </div>
  );
}
