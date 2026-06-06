import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProductCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  image: string;
}
