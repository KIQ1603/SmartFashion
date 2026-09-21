import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SettingsService } from './settings.service';

@Controller()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // Public - storefront (banner trang chủ, thông tin liên hệ, tài khoản chuyển khoản ở checkout)
  // đều cần đọc được mà không cần đăng nhập.
  @Public()
  @Get('settings')
  get() {
    return this.settingsService.get();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/settings')
  update(@Body() body: any) {
    return this.settingsService.update(body);
  }
}
