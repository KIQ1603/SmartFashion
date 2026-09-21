'use client';

import type { Product } from '@/types';
import ProductCard from './ProductCard';
import { RevealStagger, RevealStaggerItem } from '@/components/common/Reveal';

export default function ProductGrid({
  products,
  dark = false,
  aiMatched = false,
}: {
  products: Product[];
  dark?: boolean;
  aiMatched?: boolean;
}) {
  if (products.length === 0) {
    return <p className={`py-12 text-center ${dark ? 'text-background/60' : 'text-muted-foreground'}`}>Không có sản phẩm nào.</p>;
  }
  return (
    <RevealStagger className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <RevealStaggerItem key={p.id}>
          <ProductCard product={p} dark={dark} aiMatched={aiMatched} />
        </RevealStaggerItem>
      ))}
    </RevealStagger>
  );
}
