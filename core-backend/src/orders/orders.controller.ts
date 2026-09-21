import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtUserPayload } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { OrderStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('orders')
  checkout(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: { addressId?: string; paymentMethod: string; discountCode?: string },
  ) {
    return this.ordersService.checkout(user.userId, body.addressId, body.paymentMethod, body.discountCode);
  }

  @Get('orders')
  list(
    @CurrentUser() user: JwtUserPayload,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ordersService.listForUser(user.userId, {
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('orders/:id')
  detail(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.ordersService.detail(user.userId, id);
  }

  @Patch('orders/:id/cancel')
  cancel(@CurrentUser() user: JwtUserPayload, @Param('id') id: string, @Body('reason') reason: string) {
    return this.ordersService.cancel(user.userId, id, reason);
  }

  // ---- Admin ----
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/orders')
  listAll(@Query('page') page = 1, @Query('pageSize') pageSize = 20, @Query('status') status?: OrderStatus) {
    return this.ordersService.listAll({ page: Number(page), pageSize: Number(pageSize), status });
  }

  // Route riêng cho admin (khác 'orders/:id' phía trên - route đó chỉ cho khách xem đúng đơn của
  // chính mình) - xem được chi tiết (sản phẩm/địa chỉ) của BẤT KỲ đơn nào, phục vụ màn xem chi
  // tiết + xuất hóa đơn.
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/orders/:id')
  adminDetail(@Param('id') id: string) {
    return this.ordersService.detail(undefined, id, true);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('admin/orders/:id/status')
  changeStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.changeStatus(id, status);
  }
}
