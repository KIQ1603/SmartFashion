'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/types';
import { useProductColor } from './ProductColorContext';

/** Gallery ảnh sản phẩm thật (product.images) - thumbnail dọc bên trái đổi ảnh chính, khớp UI mẫu
 * "Amerce". Không dùng ảnh giả/placeholder ngoài fallback khi sản phẩm chưa có ảnh nào. */
export default function ProductGallery({
  images,
  name,
  material,
}: {
  images: ProductImage[];
  name: string;
  material?: string | null;
}) {
  const { color } = useProductColor();

  // Ảnh gắn màu cụ thể (color !== null) được ưu tiên hiện khi khách chọn đúng màu đó ở
  // ProductActions - nếu màu đang chọn chưa có ảnh riêng thì fallback về ảnh chung (color = null).
  const list = useMemo(() => {
    const forColor = color ? images.filter((i) => i.color === color) : [];
    const general = images.filter((i) => !i.color);
    const pool = forColor.length > 0 ? forColor : general.length > 0 ? general : images;
    const sorted = [...pool].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
    return sorted.length > 0 ? sorted : [{ id: 'placeholder', imageUrl: 'https://picsum.photos/seed/placeholder/600/800', isPrimary: true }];
  }, [images, color]);

  const [active, setActive] = useState(0);
  // Đổi màu -> danh sách ảnh hiển thị đổi theo -> luôn quay về ảnh đầu tiên của bộ ảnh mới,
  // tránh giữ index cũ trỏ lệch sang ảnh không liên quan.
  useEffect(() => setActive(0), [list]);

  return (
    <div className="flex gap-3 sm:gap-4">
      {list.length > 1 && (
        <div className="flex w-16 shrink-0 flex-col gap-2.5 sm:w-20">
          {list.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              aria-current={active === i}
              className={`relative aspect-[3/4] cursor-pointer overflow-hidden rounded-md bg-muted ring-1 ring-inset transition-all ${
                active === i ? 'ring-2 ring-foreground' : 'ring-border hover:ring-foreground/40'
              }`}
            >
              <Image src={img.imageUrl} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-xl bg-muted shadow-lift">
        <Image src={list[active].imageUrl} alt={name} fill priority sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
        {/* Badge chất liệu - chỉ hiện khi sản phẩm có dữ liệu material thật, không bịa nhãn
            "Premium" chung chung cho mọi sản phẩm. */}
        {material && (
          <span className="absolute right-3 top-3 flex h-16 w-16 flex-col items-center justify-center rounded-full border border-border-soft bg-warm/95 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-foreground shadow-soft backdrop-blur-sm sm:h-20 sm:w-20 sm:text-[11px]">
            {material}
          </span>
        )}
      </div>
    </div>
  );
}
