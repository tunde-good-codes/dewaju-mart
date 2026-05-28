import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "./entities/categories.entities";
import { Repository } from "typeorm";
import { CreateProductCategoryDto } from "./dtos/create-product-category.dto";
import slugify from "slugify";
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}

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
    return{
      newCategory
    }
  }
  getHello(): string {
    return "Hello World!";
  }
}
