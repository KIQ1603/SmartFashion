import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new BadRequestException('Thiếu session_id cho khách vãng lai (header x-session-id).');
    }

    const where = userId ? { userId } : { sessionId };
    const existing = await this.prisma.cart.findUnique({ where });
    if (existing) return existing;

    try {
      return await this.prisma.cart.create({ data: userId ? { userId } : { sessionId } });
    } catch (e: any) {
      // Race hiếm gặp: 2 request cùng lúc (vd. Header tự gọi getCart() trong khi trang sản phẩm
      // đang addItem) cùng lần đầu tạo giỏ cho 1 user/session - Postgres chặn trùng qua unique
      // constraint (user_id/session_id), chỉ cần đọc lại bản ghi request kia vừa tạo thành công.
      // upsert() không dùng được ở đây vì update:{} rỗng khiến Prisma fallback select+insert
      // không atomic, chính là nguyên nhân gốc gây lỗi 500 "Unique constraint failed" trước đó.
      if (e.code === 'P2002') {
        const cart = await this.prisma.cart.findUnique({ where });
        if (cart) return cart;
      }
      throw e;
    }
  }

  private async fullCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { variant: { include: { product: { include: { images: true } } } } } } },
    });
    const subtotal =
      cart?.items.reduce((sum, item) => sum + Number(item.variant.product.basePrice) * item.quantity, 0) || 0;
    return { ...cart, subtotal };
  }

  async getCart(userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    return this.fullCart(cart.id);
  }

  async addItem(userId: string | undefined, sessionId: string | undefined, variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Không tìm thấy biến thể sản phẩm.');
    if (variant.stockQuantity < quantity) throw new BadRequestException('Sản phẩm không đủ tồn kho.');

    const cart = await this.getOrCreateCart(userId, sessionId);
    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, variantId, quantity },
    });
    return this.fullCart(cart.id);
  }

  async updateItem(userId: string | undefined, sessionId: string | undefined, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ.');

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }
    return this.fullCart(cart.id);
  }

  async removeItem(userId: string | undefined, sessionId: string | undefined, itemId: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.fullCart(cart.id);
  }
}
