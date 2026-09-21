import Image from 'next/image';
import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import type { Category } from '@/types';

/**
 * Hàng danh mục dạng avatar tròn ("Shop By Categories") - dùng chung ở trang chủ và trang Shop.
 * Chỉ hiện 4 danh mục nhiều sản phẩm nhất + 1 ô "+" dẫn sang /categories xem toàn bộ - danh mục
 * sẽ ngày càng nhiều theo thời gian, hiện hết ra đây sẽ tràn hàng, không còn là 1 hàng gọn gàng.
 */
export default function CategoryCircles({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  const top = [...categories].sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0)).slice(0, 4);
  const hasMore = categories.length > top.length;

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-5 sm:gap-x-10 sm:gap-y-8">
      {top.map((c) => (
        <Link key={c.id} href={`/categories/${c.slug}`} className="group w-20 text-center sm:w-32">
          {/* shadow-soft + kích thước lớn hơn để ảnh danh mục "nổi" rõ, không còn phẳng như trước
              - vẫn giữ hình TRÒN (không đổi sang vuông) theo yêu cầu bắt buộc giữ nhận diện cũ. */}
          <div className="relative aspect-square overflow-hidden rounded-full border border-border bg-muted shadow-soft transition-transform duration-300 group-hover:-translate-y-1">
            <Image
              src={`https://picsum.photos/seed/category-${c.slug}/400/400`}
              alt=""
              fill
              aria-hidden
              sizes="128px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          </div>
          <p className="mt-2 text-xs font-medium text-foreground sm:mt-3 sm:text-sm">{c.name}</p>
          <p className="hidden text-xs text-muted-foreground sm:block">{c.productCount ?? 0} sản phẩm</p>
        </Link>
      ))}
      {hasMore && (
        <Link href="/categories" className="group w-20 text-center sm:w-32">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-foreground">
            <Plus size={20} className="text-muted-foreground transition-colors group-hover:text-foreground sm:hidden" aria-hidden />
            <Plus size={26} className="hidden text-muted-foreground transition-colors group-hover:text-foreground sm:block" aria-hidden />
          </div>
          <p className="mt-2 text-xs font-medium text-foreground sm:mt-3 sm:text-sm">Xem tất cả</p>
          <p className="hidden text-xs text-muted-foreground sm:block">{categories.length} danh mục</p>
        </Link>
      )}
    </div>
  );
}
