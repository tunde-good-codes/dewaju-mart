import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { AuthModule } from "./auth-service/auth.module";
import { ProductModule } from "./product-service/product.module";
import { OrderModule } from "./order-service/order.module";

@Module({
  imports: [AuthModule, ProductModule, OrderModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
