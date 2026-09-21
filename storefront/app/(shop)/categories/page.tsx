import Image from 'next/image';
import Link from 'next/link';
import { getCategoryTree } from '@/lib/api/categories';
import type { Category } from '@/types';

function flattenCategories(nodes: Category[]): Category[] {
  return nodes.flatMap((c) => [c, ...(c.children ? flattenCategories(c.children) : [])]);
}

export default async function CategoriesPage() {
  const categoryTree = await getCategoryTree().catch(() => []);
  const categories = flattenCategories(categoryTree).sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0));

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Danh mục</span>
      </nav>

      <div className="mb-10 text-center">
        <h1 className="section-heading">Tất cả danh mục</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Toàn bộ {categories.length} danh mục sản phẩm hiện có tại SmartFashion.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Chưa có danh mục nào.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="group text-center">
              <div className="relative mx-auto aspect-square w-24 overflow-hidden rounded-full bg-muted sm:w-28">
                <Image
                  src={`https://picsum.photos/seed/category-${c.slug}/400/400`}
                  alt=""
                  fill
                  aria-hidden
                  sizes="112px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.productCount ?? 0} sản phẩm</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
