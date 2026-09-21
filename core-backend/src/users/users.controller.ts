import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtUserPayload } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: JwtUserPayload) {
    return this.usersService.me(user.userId);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtUserPayload, @Body() body: any) {
    return this.usersService.updateMe(user.userId, body);
  }

  @Get('me/addresses')
  listAddresses(@CurrentUser() user: JwtUserPayload) {
    return this.usersService.listAddresses(user.userId);
  }

  @Post('me/addresses')
  createAddress(@CurrentUser() user: JwtUserPayload, @Body() body: any) {
    return this.usersService.createAddress(user.userId, body);
  }

  @Patch('me/addresses/:id')
  updateAddress(@CurrentUser() user: JwtUserPayload, @Param('id') id: string, @Body() body: any) {
    return this.usersService.updateAddress(user.userId, id, body);
  }

  @Patch('me/addresses/:id/default')
  setDefaultAddress(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.usersService.setDefaultAddress(user.userId, id);
  }

  @Delete('me/addresses/:id')
  removeAddress(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.usersService.removeAddress(user.userId, id);
  }

  @Get('me/wishlist')
  listWishlist(@CurrentUser() user: JwtUserPayload) {
    return this.usersService.listWishlist(user.userId);
  }

  @Post('me/wishlist')
  addWishlist(@CurrentUser() user: JwtUserPayload, @Body('productId') productId: string) {
    return this.usersService.addWishlist(user.userId, productId);
  }

  @Delete('me/wishlist/:productId')
  removeWishlist(@CurrentUser() user: JwtUserPayload, @Param('productId') productId: string) {
    return this.usersService.removeWishlist(user.userId, productId);
  }
}
