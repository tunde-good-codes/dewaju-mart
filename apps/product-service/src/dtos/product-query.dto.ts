import { IsOptional, IsInt, Min, IsString, IsUUID } from "class-validator";
import { Type } from "class-transformer";

export class ProductQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string; // search by product name

  @IsOptional()
  @IsString()
  sellerId?: string; // fetch products by a specific seller
}