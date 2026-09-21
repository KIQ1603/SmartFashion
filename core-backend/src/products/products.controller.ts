import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtUserPayload } from '../auth/decorators/current-user.decorator';
import { ProductsService } from './products.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { ProductQueryDto } from './dto/product-query.dto';

@Controller()
export class ProductsController {
  constructor(private productsService: ProductsService, private recommendationsService: RecommendationsService) {}

  @Public()
  @Get('products')
  list(@Query() query: ProductQueryDto) {
    return this.productsService.list(query);
  }

  @Public()
  @Get('search')
  search(@Query('q') q: string) {
    return this.productsService.search(q);
  }

  // Đăng ký TRƯỚC 'products/:id' - Nest khớp route theo thứ tự, nếu để sau thì "facets" sẽ bị
  // nuốt vào tham số :id.
  @Public()
  @Get('products/facets')
  facets(@Query('category') category?: string) {
    return this.productsService.facets(category);
  }

  @Public()
  @Get('products/:id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Public()
  @Get('products/:id/similar')
  async similar(@Param('id') id: string) {
    const ids = await this.recommendationsService.similar(id);
    return { products: await this.recommendationsService.enrich(ids) };
  }

  @Public()
  @Get('products/:id/frequently-bought-together')
  async fbt(@Param('id') id: string) {
    const ids = await this.recommendationsService.frequentlyBoughtTogether(id);
    return { products: await this.recommendationsService.enrich(ids) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('products/:id/reviews')
  addReview(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.productsService.addReview(user.userId, id, body.rating, body.comment);
  }

  // ---- Admin ----
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/products')
  create(@Body() body: any) {
    return this.productsService.createProduct(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/products/:id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.updateProduct(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/products/:id')
  remove(@Param('id') id: string) {
    return this.productsService.removeProduct(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/products/:id/variants')
  addVariant(@Param('id') id: string, @Body() body: any) {
    return this.productsService.addVariant(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/product-variants/:id')
  updateVariant(@Param('id') id: string, @Body() body: any) {
    return this.productsService.updateVariant(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/products/upload-image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chưa chọn ảnh để tải lên.');
    const imageUrl = await this.productsService.uploadImage(file.buffer);
    return { imageUrl };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/products/:id/images')
  addImage(@Param('id') id: string, @Body() body: { imageUrl: string; isPrimary?: boolean; color?: string }) {
    return this.productsService.addImage(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/product-images/:id/primary')
  setPrimaryImage(@Param('id') id: string) {
    return this.productsService.setPrimaryImage(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/product-images/:id')
  removeImage(@Param('id') id: string) {
    return this.productsService.removeImage(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/products/import-template')
  downloadImportTemplate(@Res() res: Response) {
    const buffer = this.productsService.generateImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="mau-nhap-san-pham.xlsx"');
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/products/import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  importProducts(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chưa chọn file để nhập.');
    return this.productsService.importFromExcel(file.buffer);
  }
}
