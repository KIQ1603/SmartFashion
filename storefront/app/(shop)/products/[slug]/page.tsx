import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CaretRight, Lightning, SquaresFour, Star } from '@phosphor-icons/react/dist/ssr';
import { getProduct, getSimilarProducts, getFrequentlyBoughtTogether, listProducts } from '@/lib/api/products';
import { discountPercent, formatVnd, stockStatus } from '@/lib/utils/format';
import ProductGallery from '@/components/product/ProductGallery';
import ProductActions from '@/components/product/ProductActions';
import { ProductColorProvider } from '@/components/product/ProductColorContext';
import ProductGrid from '@/components/product/ProductGrid';
import ReviewForm from '@/components/product/ReviewForm';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug).catch(() => null);
  if (!product) notFound();

  const [similar, fbt, categoryList] = await Promise.all([
    getSimilarProducts(product.id).catch(() => ({ products: [] })),
    getFrequentlyBoughtTogether(product.id).catch(() => ({ products: [] })),
    // Danh sách thật cùng danh mục để dựng điều hướng "sản phẩm kế tiếp" - thay cho icon lưới +
    // mũi tên trang trí không có tác dụng thật trong UI mẫu.
    product.category
      ? listProducts({ category: product.category.slug, pageSize: 50 }).catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] }),
  ]);
  const siblingIndex = categoryList.items.findIndex((p) => p.id === product.id);
  const nextProduct = siblingIndex >= 0 && categoryList.items.length > 1 ? categoryList.items[(siblingIndex + 1) % categoryList.items.length] : null;

  const avgRating =
    product.reviews && product.reviews.length > 0
      ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
      : null;
  const discount = discountPercent(product.basePrice, product.compareAtPrice);
  const totalStock = product.variants.reduce((s, v) => s + v.stockQuantity, 0);
  const stock = stockStatus(totalStock);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-6 flex items-center justify-between">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Trang chủ
          </Link>
          <CaretRight size={11} className="text-muted-foreground/50" aria-hidden />
          <Link href="/products" className="hover:text-foreground">
            Sản phẩm
          </Link>
          <CaretRight size={11} className="text-muted-foreground/50" aria-hidden />
          <span className="line-clamp-1 text-foreground">{product.name}</span>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              aria-label={`Xem tất cả ${product.category.name}`}
              title={`Xem tất cả ${product.category.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <SquaresFour size={17} />
            </Link>
          )}
          {nextProduct && (
            <Link
              href={`/products/${nextProduct.slug}`}
              aria-label="Sản phẩm kế tiếp cùng danh mục"
              title="Sản phẩm kế tiếp cùng danh mục"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <CaretRight size={17} />
            </Link>
          )}
        </div>
      </div>

      <ProductColorProvider initialColor={product.variants[0]?.color}>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
        <ProductGallery images={product.images} name={product.name} material={product.material} />

        <div>
          <p className="text-sm text-muted-foreground">{product.category?.name}</p>
          <h1 className="mt-1.5 font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">{product.name}</h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            {avgRating && (
              <span className="flex items-center gap-1.5">
                <Star size={15} weight="fill" className="text-accent" aria-hidden />
                <span className="font-medium text-foreground">{avgRating}</span>
                <span>({product.reviews?.length} đánh giá)</span>
              </span>
            )}
            {avgRating && !!product.soldCount && <span className="text-muted-foreground/40">|</span>}
            {/* Số đã bán thật (tổng quantity từ order_items, loại đơn đã hủy) - không phải số liệu
                "897 sold in last 32 hours" bịa đặt kiểu urgency giả trong UI mẫu. */}
            {!!product.soldCount && (
              <span className="flex items-center gap-1.5">
                <Lightning size={14} weight="fill" className="text-accent" aria-hidden />
                Đã bán {product.soldCount}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <p className="text-2xl font-semibold text-foreground">{formatVnd(product.basePrice)}</p>
            {discount && (
              <>
                <p className="text-base text-muted-foreground/70 line-through">{formatVnd(product.compareAtPrice!)}</p>
                <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  Giảm {discount}%
                </span>
              </>
            )}
          </div>

          {product.description && (
            <p className="mt-4 max-w-measure text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-7 border-t border-border pt-7">
            <ProductActions product={product} />
          </div>

          <dl className="mt-9 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm">
            <div>
              <dt className="text-muted-foreground">Thương hiệu</dt>
              <dd className="mt-0.5 font-medium text-foreground">{product.brand || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Chất liệu</dt>
              <dd className="mt-0.5 font-medium text-foreground">{product.material || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Danh mục</dt>
              <dd className="mt-0.5 font-medium text-foreground">{product.category?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tình trạng</dt>
              <dd className={`mt-0.5 font-medium ${stock.status === 'out_of_stock' ? 'text-destructive' : 'text-foreground'}`}>{stock.label}</dd>
            </div>
          </dl>
        </div>
      </div>
      </ProductColorProvider>

      {similar.products.length > 0 && (
        <section className="mt-20">
          <h2 className="section-heading mb-7">Sản phẩm tương tự</h2>
          <ProductGrid products={similar.products} />
        </section>
      )}

      {fbt.products.length > 0 && (
        <section className="mt-20">
          <h2 className="section-heading mb-7">Thường được mua cùng</h2>
          <ProductGrid products={fbt.products} />
        </section>
      )}

      <section id="danh-gia" className="mt-20 max-w-2xl scroll-mt-20">
        <h2 className="section-heading mb-7">Đánh giá sản phẩm</h2>
        <div className="mb-7 space-y-5">
          {product.reviews?.length ? (
            product.reviews.map((r) => (
              <div key={r.id} className="border-b border-border pb-5 text-sm">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  {r.user?.fullName}
                  <span className="flex items-center gap-0.5" aria-hidden>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} weight={s <= r.rating ? 'fill' : 'regular'} className="text-accent" />
                    ))}
                  </span>
                </p>
                {r.comment && <p className="mt-1.5 text-muted-foreground">{r.comment}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có đánh giá nào.</p>
          )}
        </div>
        <ReviewForm productId={product.id} reviews={product.reviews} />
      </section>
    </div>
  );
}
