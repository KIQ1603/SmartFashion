'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingBagOpen, Trash } from '@phosphor-icons/react';
import type { Cart } from '@/types';
import { getCart, updateCartItem, removeCartItem } from '@/lib/api/cart';
import { formatVnd, primaryImage } from '@/lib/utils/format';
import { useAuthStore } from '@/store/auth';

export default function CartPage() {
  const { user } = useAuthStore();
  const [cart, setCart] = useState<Cart | null>(null);

  function reload() {
    getCart()
      .then(setCart)
      .catch(() => setCart(null));
  }

  useEffect(reload, []);

  if (!cart) {
    return (
      <div className="container-page py-10">
        <div className="skeleton mb-8 h-8 w-48" />
        <div className="space-y-4">
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="section-heading mb-9">Giỏ hàng</h1>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-20 text-center">
          <ShoppingBagOpen size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Giỏ hàng đang trống.</p>
          <Link href="/products" className="btn-primary">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* 1 khung lớn duy nhất bọc toàn bộ giỏ hàng (thay vì mỗi dòng 1 khung rời) + nền xanh
              nhạt để chữ/nút không còn nổi trực tiếp trên nền xám của trang. */}
          <div className="divide-y divide-border-soft rounded-lg border border-border bg-warm shadow-soft lg:col-span-2">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-4 p-5 sm:p-6">
                <Link
                  href={`/products/${item.variant.product.slug}`}
                  className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-md border border-border bg-muted"
                >
                  <Image src={primaryImage(item.variant.product.images)} alt={item.variant.product.name} fill className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/products/${item.variant.product.slug}`} className="font-medium text-foreground hover:underline">
                      {item.variant.product.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.variant.color} / {item.variant.size}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-md border border-border">
                      <button
                        aria-label="Giảm số lượng"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted"
                        onClick={() => updateCartItem(item.id, item.quantity - 1).then(reload).catch(() => {})}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                      <button
                        aria-label="Tăng số lượng"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted"
                        onClick={() => updateCartItem(item.id, item.quantity + 1).then(reload).catch(() => {})}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      aria-label="Xóa khỏi giỏ hàng"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                      onClick={() => removeCartItem(item.id).then(reload).catch(() => {})}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
                <p className="font-semibold tabular-nums text-foreground">
                  {formatVnd(Number(item.variant.product.basePrice) * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-lg border border-border bg-warm p-6 shadow-soft sm:p-8">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-semibold tabular-nums text-foreground">{formatVnd(cart.subtotal)}</span>
            </div>
            {user ? (
              <Link href="/checkout" className="btn-primary mt-6 w-full">
                Tiến hành thanh toán
              </Link>
            ) : (
              <Link href="/login" className="btn-primary mt-6 w-full">
                Đăng nhập để thanh toán
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
