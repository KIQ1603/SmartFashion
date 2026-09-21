import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DiscountCodesModule } from '../discount-codes/discount-codes.module';

@Module({
  imports: [DiscountCodesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
