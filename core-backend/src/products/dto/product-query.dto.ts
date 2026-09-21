import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsNumber } from 'class-validator';

export class ProductQueryDto {
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() size?: string;
  /** Tìm kiếm theo tên/mô tả/thương hiệu - dùng chung 1 trang /products với bộ lọc thay vì 1
   * trang /search tách biệt không có filter/phân trang. */
  @IsOptional() @IsString() q?: string;

  @IsOptional() @Type(() => Number) @IsNumber() minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;

  /** Chỉ trả sản phẩm có compareAtPrice (đang giảm giá) - dùng cho tab "Đang giảm giá" trang chủ. */
  @IsOptional() @Type(() => Boolean) @IsBoolean() onSale?: boolean;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc', 'newest', 'bestselling'])
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'bestselling';

  @IsOptional() @Type(() => Number) @IsNumber() page?: number = 1;
  @IsOptional() @Type(() => Number) @IsNumber() pageSize?: number = 20;
}
