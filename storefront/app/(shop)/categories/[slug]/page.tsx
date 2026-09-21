import { notFound } from 'next/navigation';
import { listProducts } from '@/lib/api/products';
import { getCategoryTree } from '@/lib/api/categories';
import { getTrending } from '@/lib/api/recommendations';
import ProductGrid from '@/components/product/ProductGrid';
import PaginatedProducts from '@/components/product/PaginatedProducts';
import type { Category } from '@/types';

function findBySlug(categories: Category[], slug: string): Category | undefined {
  for (const c of categories) {
    if (c.slug === slug) return c;
    if (c.children?.length) {
      const found = findBySlug(c.children, slug);
      if (found) return found;
    }
  }
  return undefined;
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categories = await getCategoryTree().catch(() => []);
  const category = findBySlug(categories, params.slug);
  if (!category) notFound();

  const pageSize = 24;
  const [{ items, total }, trending] = await Promise.all([
    listProducts({ category: params.slug, pageSize }),
    getTrending(category.id).catch(() => ({ products: [] })),
  ]);

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="section-heading mb-9">{category.name}</h1>
      {/* Trước đây tải cứng 24 sản phẩm đầu, không có cách nào xem tiếp nếu danh mục có nhiều hơn
          24 sản phẩm - dùng chung component phân trang số với trang /products. */}
      <PaginatedProducts initialItems={items} total={total} pageSize={pageSize} filters={{ category: params.slug }} />

      {trending.products.length > 0 && (
        <section className="mt-20">
          <h2 className="section-heading mb-7">Xu hướng trong danh mục này</h2>
          <ProductGrid products={trending.products} />
        </section>
      )}
    </div>
  );
}
