import Link from 'next/link';
import { listProducts, getProductFacets } from '@/lib/api/products';
import { getCategoryTree } from '@/lib/api/categories';
import CategoryCircles from '@/components/product/CategoryCircles';
import ShopToolbar from '@/components/product/ShopToolbar';
import PaginatedProducts from '@/components/product/PaginatedProducts';
import type { Category } from '@/types';

interface SearchParams {
  category?: string;
  brand?: string;
  color?: string;
  minPrice?: string;
  maxPrice?: string;
  onSale?: string;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'bestselling';
}

function flattenCategories(nodes: Category[]): Category[] {
  return nodes.flatMap((c) => [c, ...(c.children ? flattenCategories(c.children) : [])]);
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = {
    category: searchParams.category,
    brand: searchParams.brand,
    color: searchParams.color,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    onSale: searchParams.onSale === '1' ? true : undefined,
    q: searchParams.q,
    sort: searchParams.sort,
  };
  const [{ items, total, pageSize }, categoryTree, facets] = await Promise.all([
    listProducts({ ...filters, page: 1 }),
    getCategoryTree().catch(() => []),
    getProductFacets(searchParams.category).catch(() => ({ brands: [], colors: [], minPrice: 0, maxPrice: 0 })),
  ]);
  const categories = flattenCategories(categoryTree);

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Sản phẩm</span>
      </nav>

      <div className="mb-10 text-center">
        <h1 className="section-heading">{searchParams.q ? `Kết quả tìm kiếm cho "${searchParams.q}"` : 'Sản phẩm'}</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          {searchParams.q
            ? `${total} sản phẩm phù hợp.`
            : 'Khám phá bộ sưu tập được chọn lọc — gợi ý ngày càng đúng hơn theo mỗi lượt bạn xem, lưu và mua.'}
        </p>
      </div>

      {!searchParams.q && (
        <div className="mb-10 border-b border-border-soft pb-10">
          <CategoryCircles categories={categories} />
        </div>
      )}

      <ShopToolbar
        categories={categories}
        facets={facets}
        currentCategory={searchParams.category}
        currentSort={searchParams.sort}
        currentBrand={searchParams.brand}
        currentColor={searchParams.color}
        currentMinPrice={filters.minPrice}
        currentMaxPrice={filters.maxPrice}
        currentOnSale={filters.onSale}
        currentQuery={searchParams.q}
        total={total}
      />

      {items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</p>
      ) : (
        <PaginatedProducts initialItems={items} total={total} pageSize={pageSize} filters={filters} />
      )}
    </div>
  );
}
