'use client';

import { createContext, useContext, useState } from 'react';

interface ProductColorContextValue {
  color: string | null;
  setColor: (c: string) => void;
}

const ProductColorContext = createContext<ProductColorContextValue | null>(null);

/**
 * Chia sẻ màu đang chọn giữa ProductGallery (đổi ảnh theo màu) và ProductActions (nơi khách bấm
 * chọn màu) - 2 client component nằm ở 2 cột riêng trong page.tsx (Server Component), không có
 * component cha chung nào khác ngoài chính page - dùng Context thay vì lift state lên page.tsx để
 * page.tsx vẫn giữ được là Server Component (SSR title/giá/mô tả), chỉ bọc phần cần state trong
 * Provider này.
 */
export function ProductColorProvider({ children, initialColor }: { children: React.ReactNode; initialColor?: string | null }) {
  const [color, setColor] = useState<string | null>(initialColor ?? null);
  return <ProductColorContext.Provider value={{ color, setColor }}>{children}</ProductColorContext.Provider>;
}

export function useProductColor() {
  const ctx = useContext(ProductColorContext);
  if (!ctx) throw new Error('useProductColor phải dùng bên trong ProductColorProvider');
  return ctx;
}
