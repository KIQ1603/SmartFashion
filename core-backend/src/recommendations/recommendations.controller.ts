import { Controller, Get, Query } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser, JwtUserPayload } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('homepage')
  async homepage(@CurrentUser() user: JwtUserPayload) {
    const { productIds, algorithm } = await this.recommendationsService.homepage(user?.userId);
    const products = await this.recommendationsService.enrich(productIds);
    return { algorithm, products };
  }

  @Public()
  @Get('trending')
  async trending(@Query('category_id') categoryId?: string) {
    const ids = await this.recommendationsService.trending(categoryId);
    const products = await this.recommendationsService.enrich(ids);
    return { products };
  }
}
