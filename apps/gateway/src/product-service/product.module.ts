import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ProductService } from "./product-service";
import { ProductController } from "./product.controller";

@Module({
  imports: [HttpModule],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}
