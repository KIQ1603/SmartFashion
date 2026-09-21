import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SINGLETON_ID = 'singleton';

export interface HeroSlideInput {
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /** Luôn có đúng 1 bản ghi cấu hình - upsert rỗng nếu admin chưa từng cấu hình gì, để storefront
   * gọi GET /settings không bao giờ phải xử lý "chưa tồn tại" riêng, chỉ cần kiểm tra field null. */
  async get() {
    return this.prisma.siteSetting.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async update(data: Partial<{
    heroImageUrl: string;
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
    heroCtaHref: string;
    heroSlides: HeroSlideInput[] | null;
    storeAddress: string;
    storePhone: string;
    storeEmail: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
  }>) {
    // Chuỗi rỗng "" admin xóa trắng 1 field -> lưu thành null để storefront ẩn hẳn phần đó
    // (kiểm tra !!field), không hiện 1 dòng trống vô nghĩa. heroSlides là mảng JSON - không đi qua
    // logic .trim() dành cho chuỗi, chỉ giữ nguyên (hoặc null nếu rỗng/không phải mảng).
    const normalized: Record<string, string | HeroSlideInput[] | null> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'heroSlides') {
        normalized[key] = Array.isArray(value) && value.length > 0 ? (value as HeroSlideInput[]) : null;
        continue;
      }
      normalized[key] = typeof value === 'string' && value.trim() ? value.trim() : null;
    }
    return this.prisma.siteSetting.upsert({
      where: { id: SINGLETON_ID },
      update: normalized,
      create: { id: SINGLETON_ID, ...normalized },
    });
  }
}
