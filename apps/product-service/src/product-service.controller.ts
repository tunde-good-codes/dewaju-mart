import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ProductService } from "./product-service.service";
import { CreateProductCategoryDto } from "./dtos/create-product-category.dto";
import { JwtAuthGuard } from "apps/auth-service/src/guards/jwt-auth.guard";
import { Roles } from "apps/auth-service/src/decorators/roles.decoraror";
import { UserRole } from "apps/auth-service/src/entities/User";
import { ResponseMessage } from "libs/decorator/response.message.decorator";
import { CreateProductDto } from "./dtos/create-product-dto";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { RolesGuard } from "apps/auth-service/src/guards/role.guard";

@Controller()
export class ProductServiceController {
  constructor(private readonly productService: ProductService) {}


  @Post("category")
  @ResponseMessage("a new product category been created")
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    })
  )
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async createCategory(
    @Body() dto: CreateProductCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      })
    )
    image: Express.Multer.File
  ) {
    return await this.productService.createProductCategory(dto, image);
  }

  @Get("category")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("all categories fetched")
  async getAllCategories() {
    return await this.productService.getAllCategories();
  }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @UseInterceptors(
    FilesInterceptor("files", 4, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
    })
  )
  @ResponseMessage("product created successfully")
  async createProduct(
    @Req() req,
    @Body() dto: CreateProductDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      })
    )
    files: Express.Multer.File[]
  ) {
    console.log(req.user);

    return this.productService.createProduct(dto, files, req.user.id);
  }

  @Get(":id")
  async getProduct(@Param("id", ParseUUIDPipe) id: string) {
    return this.productService.findById(id);
  }

  @Delete(":id")
  @ResponseMessage("product deleted")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteProduct(@Param("id", ParseUUIDPipe) id: string) {
    return this.productService.deleteProduct(id);
  }

  @Get()
  @ResponseMessage("product fetched")
  @HttpCode(HttpStatus.ACCEPTED)
  async getAllProduct() {
    return this.productService.findAllProduct();
  }
}
