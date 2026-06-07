import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { CreateProductCategoryDto } from "apps/product-service/src/dtos/create-product-category.dto";
import { CreateProductDto } from "apps/product-service/src/dtos/create-product-dto";
import FormData from "form-data";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ProductService {
  constructor(private readonly httpService: HttpService) {}
  private readonly productServer = `http://localhost:${SERVICES_PORT.PRODUCT_SERVICE}/api/v1/products`;
  private readonly logger = new Logger("gateway-product");
  async createProductCategory(
    data: CreateProductCategoryDto,
    image: Express.Multer.File,
    token: string
  ) {
    const form = new FormData();
    form.append("image", image.buffer, {
      filename: image.originalname,
      contentType: image.mimetype,
    });

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, String(value));
      }
    });

    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.productServer}/category`, form, {
          headers: {
            Authorization: token,
            ...form.getHeaders(),
          },
        })
      );

      return result.data;
    } catch (error) {
      const responseData = error?.response?.data;
      const status = error?.response?.status || 500;

      this.logger.error(
        `Error creating category: ${JSON.stringify(responseData)}`
      );

      throw new HttpException(responseData || "Internal server error", status);
    }
  }
  async getAllCategories(token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.productServer}/category`, {
          headers: {
            Authorization: token,
          },
        })
      );
      return result.data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  async createProduct(
    token: string,
    files: Express.Multer.File[],
    dto: CreateProductDto
  ) {
    const form = new FormData();
    files.forEach((file) => {
      form.append("files", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, String(value));
      }
    });

    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.productServer}`, form, {
          headers: {
            Authorization: token,
            ...form.getHeaders(),
          },
        })
      );

      return result.data;
    } catch (error) {
      this.logger.error(`Error creating a new product: ${error.message}`);

      throw new HttpException(
        error?.response?.data || "Internal server error",
        error?.response?.status || 500
      );
    }
  }

  async deleteProduct(id: string, token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.delete(`${this.productServer}/${id}`, {
          headers: {
            Authorization: token,
          },
        })
      );

      return result.data;
    } catch (error) {

      throw new BadRequestException(
        error?.response?.data || "Internal server error",
        error?.response?.status || 500);
    }
  }

  async getAllProduct( token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.productServer}`, {
          headers: {
            Authorization: token,
          },
        })
      );

      return result.data;
    } catch (error) {
      const response = error?.response?.data
      throw new BadRequestException("error getting product: " + response);
    }
  }
}
