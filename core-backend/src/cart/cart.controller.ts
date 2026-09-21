import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser, JwtUserPayload } from '../auth/decorators/current-user.decorator';
import { CartService } from './cart.service';

@Public()
@UseGuards(OptionalJwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: JwtUserPayload, @Headers('x-session-id') sessionId?: string) {
    return this.cartService.getCart(user?.userId, sessionId);
  }

  @Post('items')
  addItem(
    @CurrentUser() user: JwtUserPayload,
    @Headers('x-session-id') sessionId: string,
    @Body() body: { variantId: string; quantity?: number },
  ) {
    return this.cartService.addItem(user?.userId, sessionId, body.variantId, body.quantity ?? 1);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: JwtUserPayload,
    @Headers('x-session-id') sessionId: string,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItem(user?.userId, sessionId, id, quantity);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: JwtUserPayload, @Headers('x-session-id') sessionId: string, @Param('id') id: string) {
    return this.cartService.removeItem(user?.userId, sessionId, id);
  }
}
