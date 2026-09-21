import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService, private usersService: UsersService) {}

  @Get('dashboard/stats')
  stats() {
    return this.adminService.dashboardStats();
  }

  @Get('recommendation-metrics')
  recommendationMetrics(@Query('limit') limit = 30) {
    return this.adminService.recommendationMetrics(Number(limit));
  }

  @Get('users')
  async listUsers(@Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    const [items, total] = await Promise.all([
      this.usersService.listAll({ page: Number(page), pageSize: Number(pageSize) }),
      this.usersService.count(),
    ]);
    return { items, total, page: Number(page), pageSize: Number(pageSize) };
  }

  @Patch('users/:id/status')
  setUserActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.usersService.setActive(id, isActive);
  }

  @Get('attribute-options')
  attributeOptions() {
    return this.adminService.attributeOptions();
  }

  @Post('attribute-options')
  addAttributeOption(@Body() body: { type: string; value: string }) {
    return this.adminService.addAttributeOption(body.type, body.value);
  }

  @Delete('attribute-options/:id')
  removeAttributeOption(@Param('id') id: string) {
    return this.adminService.removeAttributeOption(id);
  }
}
