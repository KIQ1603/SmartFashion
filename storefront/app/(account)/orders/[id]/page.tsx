'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star } from '@phosphor-icons/react';
import { getOrder, cancelOrder } from '@/lib/api/orders';
import { formatVnd, primaryImage } from '@/lib/utils/format';
import type { Order } from '@/types';

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  packed: 'Đã đóng gói',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

// Cùng 1 bảng màu semantic dùng chung ý nghĩa với danh sách đơn hàng (dot màu) - ở đây render
// thành badge đầy đủ vì trang chi tiết cần trạng thái nổi bật hơn, không chỉ là 1 chấm nhỏ.
const STATUS_BADGE: Record<Order['status'], string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-blue-500/10 text-blue-600',
  packed: 'bg-cyan-600/10 text-cyan-700',
  shipping: 'bg-blue-500/10 text-blue-600',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
};

// Khách chỉ hủy được khi shop CHƯA đóng gói - khớp CANCELLABLE_STATUSES ở orders.service.ts
// backend, tránh hiện nút Hủy trong khi bấm vào chắc chắn bị từ chối.
const CANCELLABLE_STATUSES: Order['status'][] = ['pending', 'confirmed'];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  function reload() {
    // Không .catch() sẽ để lộ "Uncaught (in promise)" khi accessToken hết hạn và refresh cũng
    // thất bại, hoặc đơn hàng không thuộc về người dùng hiện tại.
    getOrder(params.id)
      .then(setOrder)
      .catch(() => router.push('/orders'));
  }
  useEffect(reload, [params.id]);

  async function handleCancel() {
    if (!order) return;
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy đơn.');
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder(order.id, cancelReason.trim());
      setShowCancelForm(false);
      setCancelReason('');
      reload();
    } catch (err: any) {
      setCancelError(err.message || 'Không hủy được đơn hàng.');
    } finally {
      setCancelling(false);
    }
  }

  if (!order) {
    return (
      <div className="container-page py-10 sm:py-14">
        <div className="skeleton mb-6 h-4 w-40" />
        <div className="skeleton h-8 w-56" />
      </div>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const subtotal = order.items.reduce((s, item) => s + Number(item.price) * item.quantity, 0);

  return (
    <div className="container-page py-10 sm:py-14">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft size={15} />
        Quay lại lịch sử đơn hàng
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start lg:gap-10">
        {/* 1 khung lớn duy nhất ôm trọn đơn hàng/sản phẩm/địa chỉ/thanh toán - bố cục bên trong
            (từng khối, thứ tự, khoảng cách) giữ nguyên như trước, chỉ gộp chung 1 viền + shadow
            ngoài cùng thay vì 3 khung rời, các khối con ngăn nhau bằng border-t. */}
        <div className="overflow-hidden rounded-lg border border-border bg-warm shadow-soft lg:col-span-2">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h1 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl">Đơn hàng #{order.id.slice(0, 8)}</h1>
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${STATUS_BADGE[order.status]}`}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
            {order.status === 'cancelled' && order.cancelReason && (
              <p className="mt-2 text-sm text-destructive">Lý do hủy: {order.cancelReason}</p>
            )}
          </div>

          {/* border-t (đậm hơn border-soft) để phân tách RÕ giữa các phần lớn (đơn hàng/sản phẩm/
              địa chỉ) - phản hồi trực tiếp: "bố cục rõ ràng phần nào ra phần đấy". */}
          <div className="border-t border-border">
            <p className="px-6 pt-6 text-sm font-medium text-foreground sm:px-8">Sản phẩm</p>
            <div className="mt-1 divide-y divide-border-soft">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-5 sm:px-8">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <Image src={primaryImage(item.variant.product.images)} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.variant.product.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.variant.color} / {item.variant.size} · SL {item.quantity}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-sm font-medium tabular-nums text-foreground">{formatVnd(Number(item.price) * item.quantity)}</span>
                    {/* Chỉ mở được đánh giá khi đơn ĐÃ GIAO thành công - khớp điều kiện ProductsService.
                        addReview() ở backend (chỉ chấp nhận khi order.status === 'delivered'). */}
                    {order.status === 'delivered' && (
                      <Link
                        href={`/products/${item.variant.product.slug}#danh-gia`}
                        className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                      >
                        <Star size={12} weight="fill" />
                        Đánh giá
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 border-t border-border p-6 sm:grid-cols-2 sm:p-8">
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">Địa chỉ giao hàng</p>
              {order.address ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {order.address.recipient} — {order.address.phone}
                  <br />
                  {order.address.line}, {order.address.city}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Không có thông tin địa chỉ.</p>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">Phương thức thanh toán</p>
              <p className="text-sm text-muted-foreground">
                {(order.paymentMethod && PAYMENT_LABEL[order.paymentMethod]) || 'Thanh toán khi nhận hàng (COD)'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary + action luôn nằm cùng khối bên phải, sticky theo cột trái dài - hành động hủy
            đơn đặt ngay dưới tổng tiền thay vì trôi 1 mình giữa trang (note.md §16). */}
        <div className="h-fit space-y-5 rounded-lg border border-border bg-warm p-6 shadow-soft sm:p-8 lg:sticky lg:top-24">
          <h2 className="font-medium text-foreground">Tóm tắt đơn hàng</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính</span>
              <span className="tabular-nums text-foreground">{formatVnd(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Phí vận chuyển</span>
              <span className="text-success">Miễn phí</span>
            </div>
            {order.discountCode && Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Giảm giá ({order.discountCode})</span>
                <span className="tabular-nums text-success">-{formatVnd(order.discountAmount!)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
            <span>Tổng cộng</span>
            <span className="tabular-nums">{formatVnd(order.totalAmount)}</span>
          </div>

          {canCancel && !showCancelForm && (
            <button onClick={() => setShowCancelForm(true)} className="btn-outline w-full">
              Hủy đơn hàng
            </button>
          )}

          {canCancel && showCancelForm && (
            <div className="space-y-3 border-t border-border-soft pt-4">
              <label className="block text-sm font-medium text-foreground">Lý do hủy đơn</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Vui lòng cho biết lý do bạn muốn hủy đơn này..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
              <div className="flex gap-2">
                <button onClick={handleCancel} disabled={cancelling} className="btn-primary min-h-10 flex-1">
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                </button>
                <button
                  onClick={() => {
                    setShowCancelForm(false);
                    setCancelError(null);
                  }}
                  className="btn-ghost min-h-10"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
