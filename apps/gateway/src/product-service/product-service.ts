import { HttpService } from "@nestjs/axios";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { CreateProductCategoryDto } from "apps/product-service/src/dtos/create-product-category.dto";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ProductService {
  constructor(private readonly httpService: HttpService) {}
  private readonly productServer = `http://localhost:${SERVICES_PORT.PRODUCT_SERVICE}/api/v1/products`;
  private readonly logger = new Logger("gateway-product");
  async createProductCategory(data: CreateProductCategoryDto, token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.productServer}/category`, data, {
          headers: {
            Authorization: token,
          },
        })
      );

      return result.data;
    } catch (error) {
  this.logger.error(
        `Error creating category: ${error.message}`
      );

      throw new HttpException(
        error?.response?.data || "Internal server error",
        error?.response?.status || 500
      );      
    }
  }
}
