export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
  productCount?: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  color?: string | null;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stockQuantity: number;
  sku: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  userId: string;
  user?: { fullName: string };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  basePrice: string | number;
  compareAtPrice?: string | number | null;
  material?: string | null;
  styleTags: string[];
  season?: string | null;
  status: string;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews?: Review[];
  avgRating?: number | null;
  reviewCount?: number;
  soldCount?: number;
}

export interface CartItem {
  id: string;
  quantity: number;
  variant: ProductVariant & { product: Product };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

export interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'packed' | 'shipping' | 'delivered' | 'cancelled';
  totalAmount: string | number;
  paymentMethod?: string | null;
  discountCode?: string | null;
  discountAmount?: string | number | null;
  cancelReason?: string | null;
  createdAt: string;
  items: Array<{ id: string; quantity: number; price: string | number; variant: ProductVariant & { product: Product } }>;
  // Backend (`orders.service.ts` -> detail()) đã include address từ trước - type này trước đây
  // thiếu field nên trang chi tiết đơn hàng chưa từng hiện được địa chỉ giao hàng thật.
  address?: Address | null;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'admin';
  gender?: string | null;
  birthYear?: number | null;
}

export interface Address {
  id: string;
  recipient: string;
  phone: string;
  line: string;
  city: string;
  province?: string | null;
  isDefault: boolean;
}
