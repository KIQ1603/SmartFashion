'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowsLeftRight, Check, CircleNotch, Heart, Minus, Plus, ShareNetwork } from '@phosphor-icons/react';
import type { Product } from '@/types';
import { addCartItem } from '@/lib/api/cart';
import { recordInteraction } from '@/lib/api/interactions';
import { addToWishlist } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth';
import { useCompareStore, MAX_COMPARE } from '@/store/compare';
import { colorToHex, formatVnd } from '@/lib/utils/format';
import SizeGuideModal from './SizeGuideModal';
import { useProductColor } from './ProductColorContext';

export default function ProductActions({ product }: { product: Product }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { productIds: compareIds, toggle: toggleCompare } = useCompareStore();
  const isComparing = compareIds.includes(product.id);

  const colors = useMemo(() => [...new Set(product.variants.map((v) => v.color))], [product.variants]);
  // Màu chọn ở đây được ProductGallery đọc qua context để đổi ảnh minh họa đúng màu (nếu có cấu
  // hình ảnh riêng theo màu) - không dùng useState cục bộ nữa.
  const { color, setColor } = useProductColor();
  const sizes = useMemo(
    () => [...new Set(product.variants.filter((v) => v.color === color).map((v) => v.size))],
    [product.variants, color],
  );
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  // Đổi màu -> danh sách size khả dụng đổi theo -> tự chọn lại size đầu tiên nếu size cũ không còn.
  useEffect(() => {
    if (!size || !sizes.includes(size)) setSize(sizes[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes]);

  const selectedVariant = product.variants.find((v) => v.size === size && v.color === color);
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [shared, setShared] = useState(false);

  // Ghi nhận interaction "view" khi vào trang chi tiết sản phẩm (luồng mua hàng - đặc tả mục 3.1)
  useEffect(() => {
    recordInteraction(product.id, 'view');
  }, [product.id]);

  async function handleAddToCart() {
    if (!selectedVariant) {
      setMessage('Vui lòng chọn size và màu.');
      return null;
    }
    setLoading(true);
    setMessage(null);
    try {
      await addCartItem(selectedVariant.id, quantity);
      await recordInteraction(product.id, 'add_to_cart');
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
      return selectedVariant;
    } catch (e: any) {
      setMessage(e.message || 'Có lỗi xảy ra.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyNow() {
    if (!selectedVariant) {
      setMessage('Vui lòng chọn size và màu.');
      return;
    }
    setBuying(true);
    setMessage(null);
    try {
      await addCartItem(selectedVariant.id, quantity);
      await recordInteraction(product.id, 'add_to_cart');
      router.push('/checkout');
    } catch (e: any) {
      setMessage(e.message || 'Có lỗi xảy ra.');
      setBuying(false);
    }
  }

  async function handleWishlist() {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await addToWishlist(product.id);
      await recordInteraction(product.id, 'wishlist');
      setWishlisted(true);
    } catch (e: any) {
      setMessage(e.message || 'Có lỗi xảy ra.');
    }
  }

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        /* người dùng huỷ hộp thoại chia sẻ - không phải lỗi */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      /* clipboard không khả dụng - im lặng, không chặn trải nghiệm */
    }
  }

  return (
    <div className="space-y-6">
      {colors.length > 0 && (
        <div>
          <p className="mb-2.5 text-sm font-medium text-foreground">
            màu sắc{color && <span className="font-normal text-muted-foreground"> — {color}</span>}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                className={`h-8 w-8 cursor-pointer rounded-full ring-1 ring-inset ring-black/10 transition-shadow ${
                  color === c ? 'ring-2 ring-foreground ring-offset-2' : ''
                }`}
                style={{ backgroundColor: colorToHex(c) }}
              />
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">size{size && <span className="font-normal text-muted-foreground"> — {size}</span>}</p>
            <SizeGuideModal />
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`min-h-11 min-w-11 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors ${
                  size === s ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground hover:border-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2.5 text-sm font-medium text-foreground">số lượng</p>
        <div className="inline-flex items-center rounded-md border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Giảm số lượng"
            className="flex h-11 w-11 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={15} />
          </button>
          <span className="w-10 text-center text-sm font-medium text-foreground" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => (selectedVariant ? Math.min(selectedVariant.stockQuantity, q + 1) : q + 1))}
            disabled={!!selectedVariant && quantity >= selectedVariant.stockQuantity}
            aria-label="Tăng số lượng"
            className="flex h-11 w-11 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} />
          </button>
        </div>
        {selectedVariant && (
          <span className="ml-3 text-sm text-muted-foreground">
            {selectedVariant.stockQuantity > 0 ? `Còn ${selectedVariant.stockQuantity} sản phẩm` : 'Hết hàng'}
          </span>
        )}
      </div>

      {/* Chỉ 1 CTA đậm màu (primary) trên toàn khối hành động - "Mua ngay" là hành động người dùng
          cần chú ý nhất (bỏ qua giỏ hàng, vào thẳng thanh toán) nên giữ accent đậm; "Thêm vào giỏ"
          chuyển thành outline (secondary) để không cạnh tranh thị giác với CTA chính - trước đây
          cả 2 đều tô đặc (đen + cam) khiến người dùng không biết đâu là hành động ưu tiên. */}
      <button
        onClick={handleBuyNow}
        disabled={loading || buying || (!!selectedVariant && selectedVariant.stockQuantity === 0)}
        className="btn-primary min-h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {buying ? <CircleNotch size={18} className="animate-spin" /> : 'Mua ngay'}
      </button>

      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={loading || buying || (!!selectedVariant && selectedVariant.stockQuantity === 0)}
          className="btn-outline min-h-12 flex-1"
        >
          {loading ? (
            <>
              <CircleNotch size={18} className="animate-spin" /> Đang thêm...
            </>
          ) : justAdded ? (
            <>
              <Check size={18} weight="bold" /> Đã thêm vào giỏ
            </>
          ) : (
            // Giá hiển thị ngay trên nút là tổng thật (đơn giá x số lượng đang chọn), không phải
            // giá bịa/giá ưu đãi ảo như mẫu tham khảo - cập nhật động theo bộ đếm số lượng ở trên.
            <>Thêm vào giỏ — {formatVnd(Number(product.basePrice) * quantity)}</>
          )}
        </button>
        <button
          onClick={handleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
          className="btn-outline min-h-12 min-w-12 px-3.5"
        >
          <Heart size={19} weight={wishlisted ? 'fill' : 'regular'} className={wishlisted ? 'text-accent' : ''} />
        </button>
      </div>

      <div className="flex items-center gap-5 border-t border-border pt-5 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => toggleCompare(product.id)}
          disabled={!isComparing && compareIds.length >= MAX_COMPARE}
          title={!isComparing && compareIds.length >= MAX_COMPARE ? `Chỉ so sánh tối đa ${MAX_COMPARE} sản phẩm` : undefined}
          className={`flex cursor-pointer items-center gap-1.5 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${isComparing ? 'text-foreground' : ''}`}
        >
          <ArrowsLeftRight size={16} weight={isComparing ? 'bold' : 'regular'} />
          {isComparing ? 'Đã thêm để so sánh' : 'So sánh'}
        </button>
        <button type="button" onClick={handleShare} className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-foreground">
          <ShareNetwork size={16} />
          {shared ? 'Đã sao chép liên kết' : 'Chia sẻ'}
        </button>
      </div>

      {message && <p className="text-sm text-destructive">{message}</p>}
    </div>
  );
}
