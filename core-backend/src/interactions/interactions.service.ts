import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

// Trọng số implicit score - đúng bảng mục 2.1 tài liệu phân tích bài toán
const IMPLICIT_SCORE_MAP: Record<string, number> = {
  view: 1,
  wishlist: 2,
  add_to_cart: 3,
  remove_from_cart: -1,
  purchase: 5,
  return: -3,
};

@Injectable()
export class InteractionsService {
  constructor(private prisma: PrismaService) {}

  async record(userId: string | undefined, dto: CreateInteractionDto) {
    return this.prisma.userInteraction.create({
      data: {
        userId: userId || null,
        sessionId: userId ? null : dto.sessionId,
        productId: dto.productId,
        interactionType: dto.interactionType,
        implicitScore: IMPLICIT_SCORE_MAP[dto.interactionType] ?? 0,
        dwellTimeSeconds: dto.dwellTimeSeconds,
      },
    });
  }
}
