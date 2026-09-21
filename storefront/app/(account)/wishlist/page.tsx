'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart } from '@phosphor-icons/react';
import { getWishlist } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/common/Pagination';
import type { Product } from '@/types';

// Backend chưa có endpoint phân trang riêng cho wishlist (trả về toàn bộ 1 lần), nên phân trang
// ở đây làm phía client (cắt mảng theo trang) - đủ dùng vì wishlist thường không quá vài chục sản
// phẩm; nếu sau này endpoint có phân trang thật thì đổi sang cách gọi API như trang đơn hàng.
const PAGE_SIZE = 12;

export default function WishlistPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Đợi rehydrate xong mới quyết định redirect - xem giải thích chi tiết ở store/auth.ts.
    if (!hasHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    // Không .catch() sẽ để lộ "Uncaught (in promise)" khi accessToken hết hạn và refresh cũng
    // thất bại (refresh_token hết hạn/không hợp lệ) - lúc đó điều hướng lại về đăng nhập.
    getWishlist()
      .then((items) => setProducts(items.map((i) => i.product)))
      .catch(() => router.push('/login'));
  }, [hasHydrated, user, router]);

  if (!products) {
    return (
      <div className="container-page py-10">
        <div className="skeleton h-8 w-52" />
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pageItems = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="section-heading mb-9">Sản phẩm yêu thích</h1>
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-20 text-center">
          <Heart size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Bạn chưa lưu sản phẩm yêu thích nào.</p>
          <Link href="/products" className="btn-primary">
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <>
          <ProductGrid products={pageItems} />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} total={products.length} itemLabel="sản phẩm" />
        </>
      )}
    </div>
  );
}
