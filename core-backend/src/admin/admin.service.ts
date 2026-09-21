import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async dashboardStats() {
    // 30 ngày gần nhất (kể cả hôm nay) để vẽ biểu đồ doanh thu - tính trực tiếp từ bảng orders
    // thật (loại đơn đã hủy), không phải số liệu giả lập.
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 29);

    const [totalRevenue, totalOrders, totalUsers, totalProducts, ordersByStatus, bestsellers, recentOrders, newCustomers] = await Promise.all([
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'cancelled' } } }),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.product.count(),
      this.prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.userInteraction.groupBy({
        by: ['productId'],
        where: { interactionType: 'purchase' },
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 5,
      }),
      this.prisma.order.findMany({
        where: { status: { not: 'cancelled' }, createdAt: { gte: since } },
        select: { createdAt: true, totalAmount: true },
      }),
      this.prisma.user.count({ where: { role: 'customer', createdAt: { gte: since } } }),
    ]);

    const bestsellerProducts = await this.prisma.product.findMany({
      where: { id: { in: bestsellers.map((b) => b.productId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(bestsellerProducts.map((p) => [p.id, p.name]));

    // Gộp doanh thu/số đơn theo từng ngày trong 30 ngày - khởi tạo sẵn đủ 30 ngày = 0 trước để
    // biểu đồ không bị "đứt" ở những ngày không phát sinh đơn nào.
    const dayMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }
    for (const o of recentOrders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.revenue += Number(o.totalAmount);
        entry.orders += 1;
      }
    }
    const revenueOverTime = [...dayMap.entries()].map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }));

    const nonCancelledOrders = ordersByStatus.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o._count.status, 0);
    const averageOrderValue = nonCancelledOrders > 0 ? Number(totalRevenue._sum.totalAmount || 0) / nonCancelledOrders : 0;

    return {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      averageOrderValue,
      newCustomers30d: newCustomers,
      ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count.status })),
      bestsellers: bestsellers.map((b) => ({ productId: b.productId, name: nameById.get(b.productId), purchases: b._count.productId })),
      revenueOverTime,
    };
  }

  async recommendationMetrics(limit = 30) {
    return this.prisma.modelTrainingLog.findMany({
      orderBy: { trainedAt: 'desc' },
      take: limit,
    });
  }

  /** Gộp cả 3 nhóm (thương hiệu/chất liệu/mùa) trong 1 lần gọi - form sản phẩm lẫn trang quản lý
   * tùy chọn đều cần cả 3 cùng lúc. Trả kèm `id` để trang quản lý xóa được từng dòng - không chỉ
   * trả mảng string như trước (không đủ để xóa 1 giá trị cụ thể). */
  async attributeOptions() {
    const rows = await this.prisma.attributeOption.findMany({ orderBy: { value: 'asc' } });
    const grouped: Record<string, { id: string; value: string }[]> = { brand: [], material: [], season: [] };
    for (const row of rows) {
      (grouped[row.type] ??= []).push({ id: row.id, value: row.value });
    }
    return grouped;
  }

  async addAttributeOption(type: string, value: string) {
    // upsert theo @@unique([type, value]) - admin gõ lại 1 giá trị đã có thì không lỗi, trả về
    // luôn bản ghi cũ thay vì ConflictException (khác slug/sku - trùng ở đây là bình thường,
    // không phải lỗi, vì nhiều sản phẩm cùng dùng chung 1 chất liệu/thương hiệu là chuyện thường).
    return this.prisma.attributeOption.upsert({
      where: { type_value: { type, value } },
      update: {},
      create: { type, value },
    });
  }

  removeAttributeOption(id: string) {
    return this.prisma.attributeOption.delete({ where: { id } });
  }
}
