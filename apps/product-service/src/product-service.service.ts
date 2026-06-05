import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "./entities/categories.entities";
import { Repository } from "typeorm";
import { CreateProductCategoryDto } from "./dtos/create-product-category.dto";
import slugify from "slugify";
import { Product } from "./entities/product.entities";
import { CreateProductDto } from "./dtos/create-product-dto";
import { v4 as uuid } from "uuid";
import {
  MEDIA_FOLDERS,
  UploadMultiplePayload,
  UploadMultipleResult,
} from "apps/media-service/src/media.types";
import { firstValueFrom, timeout } from "rxjs";
import { KAFKA_SERVICE, KAFKA_TOPICS } from "@app/kafka";
import { ClientKafka } from "@nestjs/microservices";

const MAX_PRODUCT_IMAGES = 4;
@Injectable()
export class ProductService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(
      KAFKA_TOPICS.UPLOAD_MULTIPLE_PRODUCT_IMAGE
    );

    await this.kafkaClient.connect();

    this.logger.log("product service kafka connected");
  }

  private readonly logger = new Logger("product-service-logics");

  async createProductCategory(dto: CreateProductCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: {
        name: dto.name,
      },
    });
    const slug = slugify(dto.name, {
      lower: true,
    });
    if (category) {
      throw new ConflictException("category with this name already exist");
    }

    const newCategory = this.categoryRepository.create({
      name: dto.name,
      slug,
    });

    await this.categoryRepository.save(newCategory);
    this.logger.log("category created");
    return {
      newCategory,
    };
  }

  async createProduct(
    dto: CreateProductDto,
    files: Express.Multer.File[],
    sellerId: string
  ): Promise<Product> {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one product image is required.");
    }

    if (files.length > MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(
        `Maximum ${MAX_PRODUCT_IMAGES} images allowed per product.`
      );
    }

    const correlationId = uuid();

    const payload: UploadMultiplePayload = {
      files: files.map((f) => ({
        buffer: f.buffer.toString("base64"),
        mimetype: f.mimetype,
        originalName: f.originalname,
      })),
      folder: MEDIA_FOLDERS.PRODUCT_IMAGES,
      maxCount: MAX_PRODUCT_IMAGES,
      correlationId,
    };

    this.logger.log(
      `Sending ${files.length} product image(s) to media-service [correlationId: ${correlationId}]`
    );

    let result: UploadMultipleResult;

    try {
      result = await firstValueFrom(
        this.kafkaClient
          .send<UploadMultipleResult>(
            KAFKA_TOPICS.UPLOAD_MULTIPLE_PRODUCT_IMAGE,
            payload
          )
          .pipe(timeout(30000))
      );
    } catch (err) {
      this.logger.error("Media service RPC timed out", err);
      throw new BadRequestException(
        "Image upload timed out. Please try again."
      );
    }

    if (!result.success) {
      throw new BadRequestException(`Image upload failed: ${result.error}`);
    }

    const product = this.productRepository.create({
      ...dto,
      sellerId,
      imageUrls: result.urls,
      imagePublicIds: result.publicIds,
    });

    const saved = await this.productRepository.save(product);
    this.logger.log(
      `Product created: ${saved.id} with ${result?.urls?.length} image(s)`
    );

    return saved;
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.productRepository
      .createQueryBuilder("product")
      .addSelect("product.imagePublicIds")
      .where("product.id = :id", { id })
      .getOne();

    if (!product) throw new NotFoundException("Product not found");

    // Clean up Cloudinary assets (fire-and-forget)
    if (product.imagePublicIds?.length) {
      this.kafkaClient.emit(KAFKA_TOPICS.MEDIA_DELETE, {
        publicIds: product.imagePublicIds,
      });
    }

    await this.productRepository.remove(product);
  }
  getHello(): string {
    return "Hello World!";
  }
}
