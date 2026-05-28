import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from "@nestjs/common";
import { ProductService } from "./product-service";
import { CreateProductCategoryDto } from "apps/product-service/src/dtos/create-product-category.dto";

@Controller("products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post("category")
  async createProductCategory(
    @Body() dto: CreateProductCategoryDto,
    @Headers("authorization") token: string
  ) {
    

      if (!token) {
      throw new BadRequestException("Authorization token missing");
    }

    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return await this.productService.createProductCategory(dto, formattedToken);
  }
}
