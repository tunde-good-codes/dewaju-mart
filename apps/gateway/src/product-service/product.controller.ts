import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Head,
  Headers,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { ProductService } from "./product-service";
import { CreateProductCategoryDto } from "apps/product-service/src/dtos/create-product-category.dto";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CreateProductDto } from "apps/product-service/src/dtos/create-product-dto";

@Controller("products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post("category")
  @UseInterceptors(
    FileInterceptor("file", {
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
    return await this.productService.createProductCategory(dto,image, formattedToken);
  }

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
}
