import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async tree() {
    const all = await this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    });
    const byId = new Map(
      all.map((c) => [c.id, { ...c, children: [] as any[], productCount: c._count.products }]),
    );
    const roots: any[] = [];
    for (const c of byId.values()) {
      if (c.parentId && byId.has(c.parentId)) {
        byId.get(c.parentId)!.children.push(c);
      } else {
        roots.push(c);
      }
    }
    // Cộng dồn số sản phẩm từ danh mục con lên danh mục cha (danh mục gốc như "Áo"/"Quần"
    // không gán sản phẩm trực tiếp, chỉ danh mục con lá mới có - cần cộng dồn để hiển thị
    // đúng số lượng trên tile "Bộ sưu tập nổi bật" ở trang chủ).
    function sumCount(node: any): number {
      const childrenSum = node.children.reduce((s: number, c: any) => s + sumCount(c), 0);
      node.productCount += childrenSum;
      delete node._count;
      return node.productCount;
    }
    roots.forEach(sumCount);
    return roots;
  }

  create(data: { name: string; slug: string; parentId?: string }) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: { name?: string; slug?: string; parentId?: string }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
