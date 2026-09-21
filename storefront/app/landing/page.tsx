import type { Metadata } from 'next';
import { listProducts } from '@/lib/api/products';
import { getCategoryTree } from '@/lib/api/categories';
import { getTrending } from '@/lib/api/recommendations';
import { primaryImage } from '@/lib/utils/format';
import LandingHero from '@/components/landing/LandingHero';
import LandingLookbook from '@/components/landing/LandingLookbook';
import type { Product } from '@/types';

export const metadata: Metadata = {
  title: 'SmartFashion — Bộ sưu tập mới',
};

// Trang landing riêng cho campaign/bộ sưu tập (khác trang chủ) - theo yêu cầu người dùng, không
// thay thế Hero trang chủ hiện có.
export default async function LandingPage() {
  const [trending, fallback, categoryTree] = await Promise.all([
    getTrending().catch(() => ({ products: [] as Product[] })),
    listProducts({ pageSize: 4 }).catch(() => ({ items: [] as Product[] })),
    getCategoryTree().catch(() => []),
  ]);

  const products = (trending.products.length > 0 ? trending.products : fallback.items).slice(0, 4);
  const heroImage = products[0] ? primaryImage(products[0].images) : 'https://picsum.photos/seed/smartfashion-hero/1600/1200';

  return (
    <>
      <LandingHero imageUrl={heroImage} />
      <LandingLookbook products={products} categories={categoryTree.slice(0, 6)} />
    </>
  );
}
