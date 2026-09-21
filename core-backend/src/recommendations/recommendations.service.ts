import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';

const REC_TIMEOUT_MS = Number(process.env.RECOMMENDATION_TIMEOUT_MS || 500);

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly baseUrl = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8000';

  constructor(private http: HttpService, private prisma: PrismaService, private redis: RedisService) {}

  /**
   * Popularity fallback: sản phẩm bán chạy/xem nhiều nhất gần đây, tính trực tiếp từ Postgres.
   * Dùng khi Recommendation Service down/timeout, hoặc user hoàn toàn mới (cold-start).
   */
  private async popularityFallback(limit = 12): Promise<string[]> {
    const cacheKey = `popularity:top:${limit}`;
    const cached = await this.redis.getJSON<string[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.userInteraction.groupBy({
      by: ['productId'],
      _sum: { implicitScore: true },
      orderBy: { _sum: { implicitScore: 'desc' } },
      take: limit,
    });

    let ids = rows.map((r) => r.productId);
    if (ids.length < limit) {
      const recent = await this.prisma.product.findMany({
        where: { status: 'active', id: { notIn: ids } },
        orderBy: { createdAt: 'desc' },
        take: limit - ids.length,
        select: { id: true },
      });
      ids = ids.concat(recent.map((p) => p.id));
    }

    await this.redis.setJSON(cacheKey, ids, 60 * 10);
    return ids;
  }

  async homepage(userId?: string): Promise<{ productIds: string[]; algorithm: string }> {
    const cacheKey = userId ? `rec:homepage:${userId}` : null;
    if (cacheKey) {
      const cached = await this.redis.getJSON<{ productIds: string[]; algorithm: string }>(cacheKey);
      if (cached) return cached;
    }

    if (userId) {
      const result = await firstValueFrom(
        this.http.get(`${this.baseUrl}/internal/recommend/homepage/${userId}`).pipe(
          timeout(REC_TIMEOUT_MS),
          catchError((err) => {
            this.logger.warn(`Recommendation Service lỗi/timeout, fallback popularity: ${err.message}`);
            return of(null);
          }),
        ),
      );
      if (result?.data?.product_ids?.length) {
        const payload = { productIds: result.data.product_ids, algorithm: result.data.algorithm || 'hybrid' };
        if (cacheKey) await this.redis.setJSON(cacheKey, payload, 60 * 30);
        return payload;
      }
    }

    const ids = await this.popularityFallback();
    return { productIds: ids, algorithm: 'popularity' };
  }

  async similar(productId: string): Promise<string[]> {
    const result = await firstValueFrom(
      this.http.get(`${this.baseUrl}/internal/recommend/similar/${productId}`).pipe(
        timeout(REC_TIMEOUT_MS),
        catchError((err) => {
          this.logger.warn(`Content-based similarity lỗi/timeout: ${err.message}`);
          return of(null);
        }),
      ),
    );
    if (result?.data?.product_ids) return result.data.product_ids;

    // Fallback đơn giản: cùng category
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) return [];
    const sameCategory = await this.prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: productId }, status: 'active' },
      take: 8,
      select: { id: true },
    });
    return sameCategory.map((p) => p.id);
  }

  async frequentlyBoughtTogether(productId: string, limit = 6): Promise<string[]> {
    // Item-item co-occurrence từ order_items thật sự cùng đơn hàng.
    const orderItems = await this.prisma.orderItem.findMany({
      where: { variant: { productId } },
      select: { orderId: true },
    });
    const orderIds = orderItems.map((o) => o.orderId);
    if (orderIds.length === 0) return [];

    const coItems = await this.prisma.orderItem.findMany({
      where: { orderId: { in: orderIds }, variant: { productId: { not: productId } } },
      select: { variant: { select: { productId: true } } },
    });

    const counts = new Map<string, number>();
    for (const item of coItems) {
      const pid = item.variant.productId;
      counts.set(pid, (counts.get(pid) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([pid]) => pid);
  }

  async trending(categoryId?: string, limit = 12): Promise<string[]> {
    const where: any = { status: 'active' };
    if (categoryId) where.categoryId = categoryId;

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true },
    });
    return products.map((p) => p.id);
  }

  /** Truy vấn PostgreSQL lấy chi tiết sản phẩm theo đúng thứ tự product_ids trả về từ AI service (bước 7-8 ở luồng dữ liệu). */
  async enrich(productIds: string[]) {
    if (productIds.length === 0) return [];
    // Bao gồm variants (bắt buộc để Product Card ở storefront tính tồn kho/swatch màu/"Thêm
    // nhanh" - thiếu field này từng gây crash "Cannot read properties of undefined (reading
    // 'filter')" trên các khối lấy dữ liệu qua Recommendation Service) và avgRating/reviewCount
    // (đồng bộ với ProductsService.list() để card hiển thị sao đánh giá nhất quán mọi nơi).
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, status: 'active' },
      include: { images: true, variants: true },
    });
    const ratingStats = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, status: 'visible' },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const ratingById = new Map(ratingStats.map((s) => [s.productId, s]));
    const byId = new Map(
      products.map((p) => [
        p.id,
        { ...p, avgRating: ratingById.get(p.id)?._avg.rating ?? null, reviewCount: ratingById.get(p.id)?._count.rating ?? 0 },
      ]),
    );
    return productIds.map((id) => byId.get(id)).filter(Boolean);
  }

  async health() {
    const result = await firstValueFrom(
      this.http.get(`${this.baseUrl}/internal/recommend/health`).pipe(
        timeout(REC_TIMEOUT_MS),
        catchError(() => of(null)),
      ),
    );
    return { recommendationService: result ? 'up' : 'down' };
  }
}
