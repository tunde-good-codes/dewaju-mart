import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Head,
  Headers,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { ProductService } from "./product-service";
import { CreateProductCategoryDto } from "apps/product-service/src/dtos/create-product-category.dto";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CreateProductDto } from "apps/product-service/src/dtos/create-product-dto";
import { ProductQueryDto } from "apps/product-service/src/dtos/product-query.dto";
import { UpdateProductDto } from "apps/product-service/src/dtos/update-product-dto";
import { ApiTags } from "@nestjs/swagger";
import {
  ApiCreate,
  ApiGetOne,
  ApiGetService,
  ApiProtectedDelete,
  ApiProtectedGetAll,
  ApiProtectedUpdate,
} from "libs/decorator/swagger.decorator";

@ApiTags("product Service")
@Controller("products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiGetService("this service is alive and active")
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "order-service",
      timestamp: new Date().toISOString(),
    };
  }

  @ApiCreate("a new product category created", CreateProductCategoryDto)
  @Post("category")
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    })
  )
  async createProductCategory(
    @Body() dto: CreateProductCategoryDto,
    @Headers("authorization") token: string,

    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      })
    )
    image: Express.Multer.File
  ) {
    if (!token) {
      throw new BadRequestException("Authorization token missing");
    }

    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return await this.productService.createProductCategory(
      dto,
      image,
      formattedToken
    );
  }

  @ApiProtectedGetAll("all product categories fetched")
  @Get("category")
  async getAllCategories(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return await this.productService.getAllCategories(formattedToken);
  }
  @ApiProtectedGetAll("all product categories fetched")
  @Get("categories")
  async getProductsCategory(@Query() query: ProductQueryDto) {
    return await this.productService.getProductsCategory(query);
  }

  @ApiCreate("a new product created", CreateProductDto)
  @Post()
  @UseInterceptors(
    FilesInterceptor("files", 4, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async createProduct(
    @Headers("authorization") token,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
          }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      })
    )
    files: Express.Multer.File[],
    @Body() dto: CreateProductDto
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return await this.productService.createProduct(formattedToken, files, dto);
  }

  @ApiProtectedDelete("product deleted")
  @Delete(":id")
  async deleteProduct(
    @Param("id") id: string,
    @Headers("authorization") token: string
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return await this.productService.deleteProduct(id, formattedToken);
  }

  @ApiProtectedGetAll("all product fetched")
  @Get()
  async getProducts(
    @Query() query: ProductQueryDto,
    @Headers("authorization") token: string | null
  ) {
    const formattedToken = token
      ? token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`
      : null;
    return await this.productService.getAllProduct(query, formattedToken);
  }

  @ApiProtectedGetAll("all my product fetched")
  @Get("my-products")
  async getMyProducts(
    @Query() query: ProductQueryDto,
    @Headers("authorization") token: string
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return await this.productService.getMyProducts(query, formattedToken);
  }

  @ApiGetOne("a single product fetched")
  @Get(":id")
  async singleProduct(@Param("id") id: string) {
    return await this.productService.getSingleProduct(id);
  }

  @ApiProtectedUpdate("product updated", UpdateProductDto)
  @Patch(":id")
  @UseInterceptors(
    FilesInterceptor("files", 4, {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    })
  )
  async updateProduct(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("authorization") token: string,
    @Body() dto: UpdateProductDto,

    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
          }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      })
    )
    files: Express.Multer.File[]
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return await this.productService.updateProduct(
      id,
      formattedToken,
      dto,
      files
    );
  }
}
