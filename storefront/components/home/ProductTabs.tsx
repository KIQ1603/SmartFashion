'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { listProducts } from '@/lib/api/products';
import ProductGrid from '@/components/product/ProductGrid';

const TABS = [
  { key: 'newest', label: 'Mới nhất', params: { sort: 'newest' as const } },
  { key: 'bestselling', label: 'Bán chạy', params: { sort: 'bestselling' as const } },
  { key: 'onSale', label: 'Đang giảm giá', params: { onSale: true } },
];

/**
 * Tab sản phẩm kiểu editorial (Mới nhất / Bán chạy / Đang giảm giá) - lấy cảm hứng từ pattern
 * "New Arrivals / Best Sellers / On Sale" trong tài liệu tham khảo UI, thay cho 1 khối lưới tĩnh.
 * Fetch cả 3 tab song song 1 lần khi mount (dữ liệu nhỏ, tránh giật khi chuyển tab).
 */
export default function ProductTabs() {
  const [active, setActive] = useState('newest');
  const [data, setData] = useState<Record<string, Product[] | null>>({ newest: null, bestselling: null, onSale: null });

  useEffect(() => {
    TABS.forEach((tab) => {
      listProducts({ ...tab.params, pageSize: 8 })
        .then((res) => setData((d) => ({ ...d, [tab.key]: res.items })))
        .catch(() => setData((d) => ({ ...d, [tab.key]: [] })));
    });
  }, []);

  const items = data[active];

  return (
    <div>
      <div className="mb-8 flex gap-6 border-b border-border" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={`cursor-pointer border-b-2 pb-3 text-sm font-medium transition-colors ${
              active === tab.key ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[3/4] w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {active === 'onSale' ? 'Hiện chưa có sản phẩm giảm giá.' : 'Không có sản phẩm nào.'}
        </p>
      ) : (
        <ProductGrid products={items} />
      )}
    </div>
  );
}
