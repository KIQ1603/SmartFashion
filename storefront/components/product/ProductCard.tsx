'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowsLeftRight, Check, CircleNotch, Eye, Heart, Sparkle, Star } from '@phosphor-icons/react';
import type { Product } from '@/types';
import { colorToHex, discountPercent, formatVnd, primaryImage, stockStatus } from '@/lib/utils/format';
import { addCartItem } from '@/lib/api/cart';
import { addToWishlist } from '@/lib/api/users';
import { recordInteraction } from '@/lib/api/interactions';
import { useAuthStore } from '@/store/auth';
import { useCompareStore, MAX_COMPARE } from '@/store/compare';
import { useRouter } from 'next/navigation';

/**
 * `dark` — card đặt trên nền tối (khối "Gợi ý cá nhân hóa" bg-foreground ở trang chủ);
 * text-foreground/muted-foreground mặc định là chữ tối, sẽ vô hình trên nền tối nếu không đảo màu.
 * `aiMatched` — hiện badge kính mờ "Gợi ý AI" trên ảnh, chỉ dùng ở khối gợi ý cá nhân hóa để
 * người dùng phân biệt đây là kết quả mô hình chọn, không phải danh sách tĩnh.
 *
 * Các nút yêu thích/so sánh/thêm nhanh đều là hành động thật (gọi API/store thật), không phải
 * icon trang trí - nằm ngoài thẻ <Link> bao ảnh để tránh lồng phần tử tương tác trong <a>.
 */
export default function ProductCard({
  product,
  dark = false,
  aiMatched = false,
}: {
  product: Product;
  dark?: boolean;
  aiMatched?: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { productIds: compareIds, toggle: toggleCompare } = useCompareStore();

  const discount = discountPercent(product.basePrice, product.compareAtPrice);
  const totalStock = product.variants?.reduce((s, v) => s + (v.stockQuantity ?? 0), 0) ?? 0;
  const stock = stockStatus(totalStock);
  const colors = useMemo(() => [...new Set((product.variants || []).map((v) => v.color))], [product.variants]);
  const isComparing = compareIds.includes(product.id);

  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const sizes = useMemo(
    // Sản phẩm đến từ Recommendation Service (similar/frequently-bought-together/gợi ý trang chủ)
    // không kèm variants trong response - luôn fallback mảng rỗng, không truy cập thẳng .filter().
    () => [...new Set((product.variants || []).filter((v) => v.color === selectedColor).map((v) => v.size))],
    [product.variants, selectedColor],
  );
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  // Đổi màu -> danh sách size khả dụng đổi theo -> tự chọn lại size đầu tiên nếu size cũ
  // không còn thuộc màu mới (tránh activeVariant bị undefined "vô hình" sau khi đổi màu).
  useEffect(() => {
    if (!sizes.includes(selectedSize)) setSelectedSize(sizes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes]);
  const activeVariant = (product.variants || []).find((v) => v.color === selectedColor && v.size === selectedSize);

  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await addToWishlist(product.id);
      await recordInteraction(product.id, 'wishlist');
      setWishlisted(true);
    } catch {
      /* im lặng - không chặn trải nghiệm duyệt sản phẩm vì 1 thao tác phụ lỗi */
    }
  }

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault();
    toggleCompare(product.id);
  }

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!activeVariant || activeVariant.stockQuantity <= 0 || adding) return;
    setAdding(true);
    setMessage(null);
    try {
      await addCartItem(activeVariant.id, 1);
      await recordInteraction(product.id, 'add_to_cart');
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } catch (err: any) {
      setMessage(err.message || 'Không thêm được vào giỏ.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block transition-transform active:scale-[0.98]">
        {/* shadow-soft để ảnh "nổi" lên khỏi nền xám của trang + border rõ để không bị lẫn vào nền
            khi ảnh sản phẩm có tông màu sáng gần giống nền (phản hồi trực tiếp: "khung cho rõ"). */}
        <div
          className={`relative aspect-[3/4] overflow-hidden rounded-lg ${dark ? 'bg-background/10' : 'border border-border bg-muted shadow-soft'}`}
        >
          <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
            {aiMatched && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                <Sparkle size={11} weight="fill" className="text-accent" aria-hidden />
                Gợi ý AI
              </span>
            )}
            {discount && (
              <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                -{discount}%
              </span>
            )}
            {stock.status !== 'in_stock' && (
              <span className="inline-flex items-center rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                {stock.label}
              </span>
            )}
          </div>

          <Image
            src={primaryImage(product.images)}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${stock.status === 'out_of_stock' ? 'opacity-60' : ''}`}
          />

          {/* Thanh "Thêm nhanh" + chọn size - hiện khi hover, cho phép thêm giỏ ngay không cần vào
              trang chi tiết. Chỉ hữu ích khi còn hàng nên ẩn nếu hết hàng.
              pointer-events-none khi ẩn (opacity-0) - thiếu dòng này thì vùng này VẪN nhận click
              dù mắt không thấy gì, khiến chạm vào card (nhất là trên điện thoại - không có hover
              thật) có thể vô tình trúng nút "Thêm nhanh"/chọn size thay vì mở trang chi tiết. */}
          {stock.status !== 'out_of_stock' && (
            <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-10 flex flex-col gap-1.5 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
              {sizes.length > 1 && (
                <div className="flex items-center justify-center gap-1 rounded-full bg-white/95 p-1 backdrop-blur-sm">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedSize(s);
                      }}
                      aria-pressed={selectedSize === s}
                      className={`min-w-7 cursor-pointer rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                        selectedSize === s ? 'bg-foreground text-background' : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={!activeVariant || activeVariant.stockQuantity <= 0 || adding}
                className="flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white/95 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? (
                  <CircleNotch size={14} className="animate-spin" />
                ) : justAdded ? (
                  <>
                    <Check size={14} weight="bold" /> Đã thêm vào giỏ
                  </>
                ) : (
                  'Thêm nhanh'
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mt-3.5 space-y-1.5">
          {/* Bỏ dòng thương hiệu - không cần thiết cho quyết định mua ở bước lướt danh sách, chỉ
              làm rối, đúng yêu cầu chỉ giữ tên/sao đánh giá/giá. */}
          <p className={`line-clamp-1 text-sm font-medium ${dark ? 'text-background' : 'text-foreground'}`}>{product.name}</p>

          {!!product.reviewCount && (
            <p className={`flex items-center gap-1 text-xs ${dark ? 'text-background/60' : 'text-muted-foreground'}`}>
              <Star size={11} weight="fill" className="text-accent" aria-hidden />
              <span className={`font-medium ${dark ? 'text-background' : 'text-foreground'}`}>{product.avgRating?.toFixed(1)}</span>
              <span>({product.reviewCount})</span>
            </p>
          )}

          {/* Giá đậm + cỡ lớn hơn hẳn phần còn lại của card để là điểm nhìn đầu tiên - trước đây
              cùng cỡ chữ với tên sản phẩm nên không nổi bật. */}
          <div className="flex items-center gap-2 pt-0.5">
            <p className={`text-base font-bold ${dark ? 'text-background' : discount ? 'text-accent' : 'text-foreground'}`}>
              {formatVnd(product.basePrice)}
            </p>
            {discount && (
              <p className={`text-xs line-through ${dark ? 'text-background/40' : 'text-muted-foreground/70'}`}>
                {formatVnd(product.compareAtPrice!)}
              </p>
            )}
          </div>

          {colors.length > 1 && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-pressed={selectedColor === c}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedColor(c);
                  }}
                  className={`h-3.5 w-3.5 cursor-pointer rounded-full ring-1 ring-inset ring-black/10 transition-shadow ${
                    selectedColor === c ? 'ring-2 ring-foreground ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: colorToHex(c) }}
                />
              ))}
            </div>
          )}
          {message && <p className="text-xs text-destructive">{message}</p>}
        </div>
      </Link>

      {/* Cụm icon hành động - nằm ngoài <Link> để không lồng phần tử tương tác trong <a>.
          pointer-events-none khi ẩn - cùng lý do với overlay "Thêm nhanh" phía trên: đây là 1
          div riêng đè lên góc trên-phải ảnh, nếu không tắt pointer-events thì chạm vào góc đó vẫn
          kích hoạt yêu thích/so sánh dù không thấy icon nào (đặc biệt trên di động). */}
      <div className="pointer-events-none absolute right-2.5 top-2.5 z-10 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
        <button
          type="button"
          onClick={handleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Heart size={16} weight={wishlisted ? 'fill' : 'regular'} className={wishlisted ? 'text-accent' : ''} />
        </button>
        <button
          type="button"
          onClick={handleCompare}
          aria-pressed={isComparing}
          aria-label={isComparing ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'}
          disabled={!isComparing && compareIds.length >= MAX_COMPARE}
          title={!isComparing && compareIds.length >= MAX_COMPARE ? `Chỉ so sánh tối đa ${MAX_COMPARE} sản phẩm` : undefined}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowsLeftRight size={16} weight={isComparing ? 'bold' : 'regular'} className={isComparing ? 'text-accent' : ''} />
        </button>
        <Link
          href={`/products/${product.slug}`}
          aria-label="Xem nhanh"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Eye size={16} />
        </Link>
      </div>
    </div>
  );
}
