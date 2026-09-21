import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { DiscountCodesService } from './discount-codes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class DiscountCodesController {
  constructor(private discountCodesService: DiscountCodesService) {}

  // Khách xem trước mức giảm ngay ở giỏ hàng (chưa tăng lượt dùng) - checkout thật sẽ validate lại
  // lần nữa trước khi thật sự trừ lượt dùng, không tin số discountAmount client tự gửi lên.
  @Public()
  @Post('discount-codes/validate')
  validate(@Body() body: { code: string; subtotal: number }) {
    if (!body.subtotal || body.subtotal <= 0) throw new BadRequestException('Giỏ hàng trống, không áp mã được.');
    return this.discountCodesService.validate(body.code, body.subtotal);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/discount-codes')
  list() {
    return this.discountCodesService.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/discount-codes')
  create(@Body() body: any) {
    return this.discountCodesService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/discount-codes/:id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.discountCodesService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/discount-codes/:id')
  remove(@Param('id') id: string) {
    return this.discountCodesService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/discount-codes/import-template')
  downloadImportTemplate(@Res() res: Response) {
    const buffer = this.discountCodesService.generateImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="mau-nhap-ma-giam-gia.xlsx"');
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/discount-codes/import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  importCodes(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chưa chọn file để nhập.');
    return this.discountCodesService.importFromExcel(file.buffer);
  }
}
