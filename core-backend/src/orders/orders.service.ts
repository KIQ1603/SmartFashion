import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// State machine hợp lệ cho đơn hàng (đặc tả kiến trúc mục 2.2). Thêm "packed" (đã đóng gói) giữa
// confirmed và shipping - mốc chặn hủy đơn: khách chỉ hủy được khi đơn CHƯA đóng gói (pending/
// confirmed), từ packed trở đi chỉ cửa hàng mới thao tác tiếp được, không cancel được nữa.
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipping'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Khách chỉ được tự hủy đơn khi cửa hàng CHƯA đóng gói - dùng chung ở cancel() (validate) và ở
// OrdersController/storefront (ẩn nút Hủy) để tránh lệch giữa hiển thị và validate thật.
const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed'];

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string, addressId: string | undefined, paymentMethod: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Giỏ hàng đang trống.');

    // Transaction (ACID): kiểm tra tồn kho -> trừ kho -> tạo order, tránh oversell
    const order = await this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      for (const item of cart.items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.stockQuantity < item.quantity) {
          throw new BadRequestException(`Sản phẩm "${item.variant.product.name}" không đủ tồn kho.`);
        }
        totalAmount += Number(item.variant.product.basePrice) * item.quantity;
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          paymentMethod,
          totalAmount,
          status: 'pending',
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.variant.product.basePrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        await tx.userInteraction.create({
          data: {
            userId,
            productId: item.variant.productId,
            interactionType: 'purchase',
            implicitScore: 5,
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    // TODO: gửi email xác nhận đơn hàng (SMTP/queue) - việc cần làm thêm cho production
    return order;
  }

  // Lọc theo trạng thái + phân trang thật (skip/take + đếm total song song) - trước đây trả về
  // toàn bộ đơn của khách 1 lần, khách nào đặt nhiều đơn (hoặc test data tích luỹ) sẽ tải cả danh
  // sách dài không giới hạn mỗi lần vào trang "Lịch sử đơn hàng".
  async listForUser(userId: string, params: { status?: OrderStatus; page?: number; pageSize?: number } = {}) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 8;
    const where = { userId, ...(params.status ? { status: params.status } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: { include: { variant: { include: { product: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async detail(userId: string | undefined, id: string, isAdmin = false) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { variant: { include: { product: true } } } }, address: true, user: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');
    if (!isAdmin && order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  async cancel(userId: string, id: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('Vui lòng nhập lý do hủy đơn.');
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== userId) throw new NotFoundException('Không tìm thấy đơn hàng.');
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException('Đơn hàng đã được đóng gói/xử lý, không thể hủy.');
    }
    return this.changeStatus(id, 'cancelled', true, reason.trim());
  }

  // ---- Admin ----
  listAll(params: { page: number; pageSize: number; status?: OrderStatus }) {
    const { page, pageSize, status } = params;
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async changeStatus(id: string, status: OrderStatus, isCancel = false, cancelReason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');

    if (!VALID_TRANSITIONS[order.status].includes(status)) {
      throw new BadRequestException(`Không thể chuyển trạng thái từ "${order.status}" sang "${status}".`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (isCancel) {
        // hoàn lại tồn kho khi hủy đơn
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }
      return tx.order.update({ where: { id }, data: { status, ...(cancelReason ? { cancelReason } : {}) } });
    });
  }
}
