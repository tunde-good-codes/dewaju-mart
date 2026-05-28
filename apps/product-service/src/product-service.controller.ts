import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ProductService } from "./product-service.service";
import { CreateProductCategoryDto } from "./dtos/create-product-category.dto";
import { JwtAuthGuard } from "apps/auth-service/src/guards/jwt-auth.guard";
import { Roles } from "apps/auth-service/src/decorators/roles.decoraror";
import { UserRole } from "apps/auth-service/src/entities/User";
import { ResponseMessage } from "libs/decorator/response.message.decorator";

@Controller()
export class ProductServiceController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  getHello(): string {
    return this.productService.getHello();
  }

  @Post("category")
  @ResponseMessage("a new product category been created")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async createCategory(@Body() dto: CreateProductCategoryDto) {
    return await this.productService.createProductCategory(dto);
  }
}
