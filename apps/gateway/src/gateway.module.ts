import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { AuthModule } from "./auth-service/auth.module";
import { ProductModule } from "./product-service/product.module";

@Module({
  imports: [AuthModule, ProductModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
