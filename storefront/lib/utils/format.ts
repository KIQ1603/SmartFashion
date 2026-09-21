export function formatVnd(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

export function primaryImage(images: { imageUrl: string; isPrimary: boolean }[] | undefined): string {
  if (!images || images.length === 0) return 'https://picsum.photos/seed/placeholder/600/800';
  return images.find((i) => i.isPrimary)?.imageUrl || images[0].imageUrl;
}

export function discountPercent(basePrice: string | number, compareAtPrice?: string | number | null): number | null {
  if (!compareAtPrice) return null;
  const base = Number(basePrice);
  const compare = Number(compareAtPrice);
  if (!compare || compare <= base) return null;
  return Math.round((1 - base / compare) * 100);
}

/** Map tên màu tiếng Việt trong dữ liệu sản phẩm sang mã hex để hiển thị swatch tròn.
 * Không map được thì trả về xám trung tính thay vì lỗi vỡ giao diện. */
const COLOR_MAP: Record<string, string> = {
  'trắng': '#F5F5F0',
  'đen': '#18181B',
  'xanh đậm': '#1E3A5F',
  'xanh nhạt': '#8FB8DE',
  'xanh lá': '#3F6B4F',
  'be': '#D8CBB0',
  'nâu': '#6B4A2E',
  'xám': '#9A9A94',
  'đỏ': '#B3382C',
  'hồng': '#E3AEB5',
  'vàng': '#D9A441',
  'cam': '#C2703D',
};

export function colorToHex(colorName: string): string {
  return COLOR_MAP[colorName.toLowerCase().trim()] || '#B0AFA8';
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function stockStatus(totalStock: number): { status: StockStatus; label: string } {
  if (totalStock <= 0) return { status: 'out_of_stock', label: 'Hết hàng' };
  if (totalStock <= 5) return { status: 'low_stock', label: 'Sắp hết hàng' };
  return { status: 'in_stock', label: 'Còn hàng' };
}
